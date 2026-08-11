/**
 * analytics — a private visitor log for the site.
 *
 *   POST /collect   a beacon from every page view. The Worker reads the real
 *                   visitor IP and Cloudflare's edge geolocation + network
 *                   operator, classifies the network, and writes one D1 row.
 *   POST /login     email + password in, short-lived signed token out.
 *   GET  /stats     token in, aggregated analytics + recent visits out.
 *
 * The visitor's browser sends the beacon straight to this Worker, so
 * CF-Connecting-IP and request.cf describe the visitor, not the site's server.
 * Auth mirrors the theater Worker: PBKDF2-SHA256 password hash held only as a
 * secret, HMAC-signed stateless tokens, constant-time comparisons.
 */

const enc = new TextEncoder();

const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const unb64url = (s) => {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Cloudflare Workers caps PBKDF2 at 100,000 iterations; this is a platform
// ceiling, not a preference. Must match scripts/analytics/hash-pass.mjs.
const PBKDF2_ITERS = 100000;
const TOKEN_TTL = 12 * 60 * 60; // seconds

async function pbkdf2(pass, saltB64) {
  const key = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: unb64url(saltB64), iterations: PBKDF2_ITERS },
    key,
    256
  );
  return b64url(bits);
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function mintToken(env) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL;
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(12)));
  const body = `${exp}.${nonce}`;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(env.TOKEN_SECRET), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

async function verifyToken(env, token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [exp, nonce, sig] = parts;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
  const expected = b64url(
    await crypto.subtle.sign("HMAC", await hmacKey(env.TOKEN_SECRET), enc.encode(`${exp}.${nonce}`))
  );
  return timingSafeEqual(sig, expected) ? { exp: Number(exp), nonce } : null;
}

function bearer(req) {
  const h = req.headers.get("Authorization") || "";
  if (h.startsWith("Bearer ")) return h.slice(7);
  return new URL(req.url).searchParams.get("t");
}

/* ---------------------------------------------------- network classifier */

// Cloudflare hands us the network operator name (asOrganization). We can't get
// a certified "residential" flag, so this is a heuristic guess from that name,
// which is exactly what the dashboard reports it as: a guess.
function classifyNet(org) {
  const o = (org || "").toLowerCase();
  if (!o) return "unknown";
  const has = (arr) => arr.some((k) => o.includes(k));

  const DATACENTER = [
    "amazon", "aws", "google llc", "google cloud", "microsoft", "azure",
    "digitalocean", "digital ocean", "linode", "akamai", "fastly", "cloudflare",
    "ovh", "hetzner", "vultr", "contabo", "leaseweb", "choopa", "m247",
    "cogent", "hurricane electric", "oracle", "alibaba", "tencent", "gcore",
    "scaleway", "upcloud", "equinix", "packet", "constant company",
    "the constant", "data center", "datacenter", "hosting", "colocation",
    "vps", "host europe", "namecheap", "godaddy", "hostinger", "dreamhost",
    "rackspace", "quadranet", "psychz", "servers",
  ];
  const MOBILE = [
    "wireless", "mobility", "cellular", "t-mobile", "verizon wireless",
    "vodafone", "telefonica", "reliance jio", "bharti airtel", "cellco",
    "cricket wireless", "boost mobile", "mobile telesystems",
  ];
  const EDU = [
    "university", "universit", "college", "école", "institute of technology",
    "school district", "academia", "research and education",
  ];
  const RESIDENTIAL = [
    "comcast", "xfinity", "spectrum", "charter", "at&t", "att internet",
    "verizon", "cox communications", "centurylink", "lumen", "frontier",
    "time warner", "windstream", "mediacom", "optimum", "altice",
    "wideopenwest", "google fiber", "sonic", "cable", "broadband", "fios",
    "fibre", "fiber", "telecom", "communications", "internet services",
    "bell canada", "rogers", "telus", "sky broadband", "virgin media",
  ];

  if (has(DATACENTER)) return "datacenter";
  if (has(MOBILE)) return "mobile";
  if (has(EDU)) return "education";
  if (has(RESIDENTIAL)) return "residential";
  if (/\b(inc|corp|corporation|ltd|limited|gmbh|b\.v|s\.a|llc)\b/.test(o)) return "corporate";
  return "unknown";
}

/* ------------------------------------------------------------------- CORS */

// ALLOWED_ORIGIN may be a comma-separated list. We echo back the request's
// Origin if it's on the list, so any of your domains works without a redeploy.
function resolveOrigin(env, req) {
  const allowed = (env.ALLOWED_ORIGIN || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.includes("*")) return "*";
  const o = req && req.headers.get("Origin");
  return o && allowed.includes(o) ? o : allowed[0] || "*";
}

function cors(env, req) {
  return {
    "Access-Control-Allow-Origin": resolveOrigin(env, req),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const json = (obj, env, status = 200, req) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors(env, req) },
  });

/* ---------------------------------------------------------------- handlers */

async function collect(req, env) {
  const cf = req.cf || {};
  let body = {};
  try {
    body = await req.json();
  } catch {
    /* beacon may be sent with sendBeacon and no parseable body */
  }
  const org = cf.asOrganization || null;
  const row = {
    ts: Date.now(),
    ip: req.headers.get("CF-Connecting-IP") || null,
    country: cf.country || null,
    region: cf.region || null,
    city: cf.city || null,
    lat: cf.latitude ? Number(cf.latitude) : null,
    lon: cf.longitude ? Number(cf.longitude) : null,
    timezone: cf.timezone || null,
    asn: cf.asn ? Number(cf.asn) : null,
    org,
    net_type: classifyNet(org),
    path: (body.path || "").slice(0, 300) || null,
    referrer: (body.referrer || "").slice(0, 500) || null,
    ua: (req.headers.get("User-Agent") || "").slice(0, 400) || null,
  };

  await env.DB.prepare(
    `INSERT INTO visits (ts, ip, country, region, city, lat, lon, timezone, asn, org, net_type, path, referrer, ua)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
    .bind(
      row.ts, row.ip, row.country, row.region, row.city, row.lat, row.lon,
      row.timezone, row.asn, row.org, row.net_type, row.path, row.referrer, row.ua
    )
    .run();

  return new Response(null, { status: 204, headers: cors(env, req) });
}

async function login(req, env) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad request" }, env, 400, req);
  }
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  const emailOk = timingSafeEqual(email, (env.ADMIN_EMAIL || "").toLowerCase());
  const got = await pbkdf2(password, env.PASS_SALT || "");
  const passOk = timingSafeEqual(got, env.PASS_HASH || "");

  if (!emailOk || !passOk) {
    return json({ error: "invalid credentials" }, env, 401, req);
  }
  return json({ token: await mintToken(env) }, env, 200, req);
}

async function stats(req, env) {
  if (!(await verifyToken(env, bearer(req)))) {
    return json({ error: "unauthorized" }, env, 401, req);
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const dayMs = startOfDay.getTime();

  const one = async (sql, ...args) => {
    const r = await env.DB.prepare(sql).bind(...args).first();
    return r ? Object.values(r)[0] : 0;
  };
  const many = async (sql, ...args) => {
    const r = await env.DB.prepare(sql).bind(...args).all();
    return r.results || [];
  };

  const [
    total, uniqueIps, today, byDay, topPaths, topCountries, topCities,
    topOrgs, netTypes, recent,
  ] = await Promise.all([
    one(`SELECT COUNT(*) FROM visits`),
    one(`SELECT COUNT(DISTINCT ip) FROM visits`),
    one(`SELECT COUNT(*) FROM visits WHERE ts >= ?`, dayMs),
    many(
      `SELECT date(ts/1000,'unixepoch') AS day, COUNT(*) AS n
       FROM visits GROUP BY day ORDER BY day DESC LIMIT 14`
    ),
    many(`SELECT path, COUNT(*) AS n FROM visits WHERE path IS NOT NULL GROUP BY path ORDER BY n DESC LIMIT 10`),
    many(`SELECT country, COUNT(*) AS n FROM visits WHERE country IS NOT NULL GROUP BY country ORDER BY n DESC LIMIT 10`),
    many(`SELECT city, region, country, COUNT(*) AS n FROM visits WHERE city IS NOT NULL GROUP BY city, region, country ORDER BY n DESC LIMIT 10`),
    many(`SELECT org, net_type, COUNT(*) AS n FROM visits WHERE net_type != 'residential' AND org IS NOT NULL GROUP BY org ORDER BY n DESC LIMIT 12`),
    many(`SELECT net_type, COUNT(*) AS n FROM visits GROUP BY net_type ORDER BY n DESC`),
    many(
      `SELECT ts, ip, city, region, country, org, net_type, asn, path
       FROM visits ORDER BY ts DESC LIMIT 120`
    ),
  ]);

  return json(
    { total, uniqueIps, today, byDay, topPaths, topCountries, topCities, topOrgs, netTypes, recent },
    env,
    200,
    req
  );
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(env, req) });
    }

    try {
      if (url.pathname === "/collect" && req.method === "POST") return await collect(req, env);
      if (url.pathname === "/login" && req.method === "POST") return await login(req, env);
      if (url.pathname === "/stats" && req.method === "GET") return await stats(req, env);
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, env, 500, req);
    }

    return json({ error: "not found" }, env, 404, req);
  },
};
