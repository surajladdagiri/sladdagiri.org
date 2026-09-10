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

/* --------------------------------------------------- user-agent parsing */

// Small hand-rolled UA parser. Order matters: Edge's UA contains "Chrome",
// Chrome's contains "Safari", so the more specific tokens are checked first.
function parseUA(ua) {
  const u = ua || "";
  if (
    /bot|crawler|spider|crawl|slurp|bingpreview|facebookexternalhit|headless|preview|monitor|python-requests|curl|wget|axios|go-http|okhttp/i.test(u)
  ) {
    return { device: "bot", os: null, browser: "Bot" };
  }

  let device = "desktop";
  if (/ipad|playbook|silk|(android(?!.*mobi))|tablet/i.test(u)) device = "tablet";
  else if (/mobi|iphone|ipod|android.*mobi|windows phone|blackberry|bb10|opera mini/i.test(u)) device = "mobile";

  let os = null;
  if (/iphone|ipad|ipod/i.test(u)) os = "iOS";
  else if (/android/i.test(u)) os = "Android";
  else if (/windows nt/i.test(u)) os = "Windows";
  else if (/mac os x/i.test(u)) os = "macOS";
  else if (/cros/i.test(u)) os = "ChromeOS";
  else if (/linux/i.test(u)) os = "Linux";

  let browser = null;
  if (/edg(a|ios|)\//i.test(u)) browser = "Edge";
  else if (/opr\/|opera/i.test(u)) browser = "Opera";
  else if (/samsungbrowser/i.test(u)) browser = "Samsung Internet";
  else if (/crios/i.test(u) || (/chrome\//i.test(u) && !/edg/i.test(u))) browser = "Chrome";
  else if (/firefox\/|fxios/i.test(u)) browser = "Firefox";
  else if (/safari/i.test(u)) browser = "Safari";

  return { device, os, browser };
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
  const ua = req.headers.get("User-Agent") || "";
  const dev = parseUA(ua);
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
    ua: ua.slice(0, 400) || null,
    device: dev.device,
    os: dev.os,
    browser: dev.browser,
  };

  await env.DB.prepare(
    `INSERT INTO visits (ts, ip, country, region, city, lat, lon, timezone, asn, org, net_type, path, referrer, ua, device, os, browser)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
    .bind(
      row.ts, row.ip, row.country, row.region, row.city, row.lat, row.lon,
      row.timezone, row.asn, row.org, row.net_type, row.path, row.referrer,
      row.ua, row.device, row.os, row.browser
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
    topOrgs, topNetworks, netTypes, devices, oses, browsers, visitors,
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
    many(`SELECT org, net_type, COUNT(*) AS n FROM visits WHERE org IS NOT NULL GROUP BY org ORDER BY n DESC LIMIT 12`),
    many(`SELECT net_type, COUNT(*) AS n FROM visits GROUP BY net_type ORDER BY n DESC`),
    many(`SELECT device, COUNT(*) AS n FROM visits WHERE device IS NOT NULL GROUP BY device ORDER BY n DESC`),
    many(`SELECT os, COUNT(*) AS n FROM visits WHERE os IS NOT NULL GROUP BY os ORDER BY n DESC LIMIT 8`),
    many(`SELECT browser, COUNT(*) AS n FROM visits WHERE browser IS NOT NULL GROUP BY browser ORDER BY n DESC LIMIT 8`),
    // One row per unique IP: its latest visit's details, total visit count, and
    // any saved nickname. Window functions pick the most recent row per IP.
    many(
      `SELECT t.ip, t.ts AS last_ts, t.city, t.region, t.country, t.org,
              t.net_type, t.device, t.os, t.browser, t.visits, l.nickname
       FROM (
         SELECT v.*,
                COUNT(*)     OVER (PARTITION BY v.ip) AS visits,
                ROW_NUMBER() OVER (PARTITION BY v.ip ORDER BY v.ts DESC) AS rn
         FROM visits v
       ) t
       LEFT JOIN ip_labels l ON l.ip = t.ip
       WHERE t.rn = 1
       ORDER BY last_ts DESC
       LIMIT 500`
    ),
  ]);

  return json(
    { total, uniqueIps, today, byDay, topPaths, topCountries, topCities, topOrgs, topNetworks, netTypes, devices, oses, browsers, visitors },
    env,
    200,
    req
  );
}

// GET /ip?ip=X — full history for one IP: every visit, the devices seen, and the
// current nickname. Auth required.
async function ipDetail(req, env) {
  if (!(await verifyToken(env, bearer(req)))) {
    return json({ error: "unauthorized" }, env, 401, req);
  }
  const ip = new URL(req.url).searchParams.get("ip");
  if (!ip) return json({ error: "ip required" }, env, 400, req);

  const many = async (sql, ...args) => {
    const r = await env.DB.prepare(sql).bind(...args).all();
    return r.results || [];
  };

  const [visits, devicesSeen, label] = await Promise.all([
    many(
      `SELECT ts, path, referrer, device, os, browser, net_type, city, region, country, org
       FROM visits WHERE ip = ? ORDER BY ts DESC LIMIT 500`,
      ip
    ),
    many(
      `SELECT device, os, browser, COUNT(*) AS n, MAX(ts) AS last
       FROM visits WHERE ip = ? GROUP BY device, os, browser ORDER BY last DESC`,
      ip
    ),
    many(`SELECT nickname FROM ip_labels WHERE ip = ?`, ip),
  ]);

  return json(
    { ip, nickname: label[0]?.nickname || "", visits, devices: devicesSeen },
    env,
    200,
    req
  );
}

// POST /label — set or clear a nickname for an IP. Auth required.
async function setLabel(req, env) {
  if (!(await verifyToken(env, bearer(req)))) {
    return json({ error: "unauthorized" }, env, 401, req);
  }
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad request" }, env, 400, req);
  }
  const ip = (body.ip || "").trim();
  const nickname = (body.nickname || "").trim().slice(0, 80);
  if (!ip) return json({ error: "ip required" }, env, 400, req);

  if (!nickname) {
    await env.DB.prepare(`DELETE FROM ip_labels WHERE ip = ?`).bind(ip).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO ip_labels (ip, nickname, updated) VALUES (?, ?, ?)
       ON CONFLICT(ip) DO UPDATE SET nickname = excluded.nickname, updated = excluded.updated`
    )
      .bind(ip, nickname, Date.now())
      .run();
  }
  return json({ ok: true, ip, nickname }, env, 200, req);
}

// POST /delete — remove every log (and the nickname) for one IP. Auth required.
async function deleteIp(req, env) {
  if (!(await verifyToken(env, bearer(req)))) {
    return json({ error: "unauthorized" }, env, 401, req);
  }
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad request" }, env, 400, req);
  }
  const ip = (body.ip || "").trim();
  if (!ip) return json({ error: "ip required" }, env, 400, req);

  const res = await env.DB.prepare(`DELETE FROM visits WHERE ip = ?`).bind(ip).run();
  await env.DB.prepare(`DELETE FROM ip_labels WHERE ip = ?`).bind(ip).run();
  return json({ ok: true, ip, deleted: res.meta?.changes ?? null }, env, 200, req);
}

// POST /clear — wipe all logs and all nicknames. Auth required.
async function clearAll(req, env) {
  if (!(await verifyToken(env, bearer(req)))) {
    return json({ error: "unauthorized" }, env, 401, req);
  }
  const res = await env.DB.prepare(`DELETE FROM visits`).run();
  await env.DB.prepare(`DELETE FROM ip_labels`).run();
  return json({ ok: true, deleted: res.meta?.changes ?? null }, env, 200, req);
}

/* ---------------------------------------------------- application tracker */

// The tracker stores one row per entry: the whole entry as a JSON blob so any
// fields can be added without a migration. Created on first use.
async function ensureTracker(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS tracker (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated INTEGER)`
  ).run();
}

const slugify = (s) =>
  (s || "").toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// GET /tracker — list every entry. Auth required (holds contacts + drafts).
async function trackerList(req, env) {
  if (!(await verifyToken(env, bearer(req)))) return json({ error: "unauthorized" }, env, 401, req);
  await ensureTracker(env);
  const r = await env.DB.prepare(`SELECT data FROM tracker ORDER BY updated DESC`).all();
  const entries = (r.results || []).map((row) => {
    try { return JSON.parse(row.data); } catch { return null; }
  }).filter(Boolean);
  return json({ entries }, env, 200, req);
}

// POST /tracker — create or update one entry. Auth required.
async function trackerUpsert(req, env) {
  if (!(await verifyToken(env, bearer(req)))) return json({ error: "unauthorized" }, env, 401, req);
  await ensureTracker(env);
  let entry = {};
  try { entry = await req.json(); } catch { return json({ error: "bad request" }, env, 400, req); }
  if (!entry || typeof entry !== "object") return json({ error: "bad entry" }, env, 400, req);
  if (!entry.name) return json({ error: "name required" }, env, 400, req);
  let id = (entry.id || "").toString().trim();
  if (!id) id = `${slugify(entry.name)}-${Date.now().toString(36)}`;
  entry.id = id;
  entry.updated = Date.now();
  await env.DB.prepare(
    `INSERT INTO tracker (id, data, updated) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated = excluded.updated`
  ).bind(id, JSON.stringify(entry), entry.updated).run();
  return json({ ok: true, entry }, env, 200, req);
}

// POST /tracker/delete — remove one entry by id. Auth required.
async function trackerDelete(req, env) {
  if (!(await verifyToken(env, bearer(req)))) return json({ error: "unauthorized" }, env, 401, req);
  await ensureTracker(env);
  let body = {};
  try { body = await req.json(); } catch { return json({ error: "bad request" }, env, 400, req); }
  const id = (body.id || "").toString().trim();
  if (!id) return json({ error: "id required" }, env, 400, req);
  const res = await env.DB.prepare(`DELETE FROM tracker WHERE id = ?`).bind(id).run();
  return json({ ok: true, id, deleted: res.meta?.changes ?? null }, env, 200, req);
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
      if (url.pathname === "/ip" && req.method === "GET") return await ipDetail(req, env);
      if (url.pathname === "/label" && req.method === "POST") return await setLabel(req, env);
      if (url.pathname === "/delete" && req.method === "POST") return await deleteIp(req, env);
      if (url.pathname === "/clear" && req.method === "POST") return await clearAll(req, env);
      if (url.pathname === "/tracker" && req.method === "GET") return await trackerList(req, env);
      if (url.pathname === "/tracker" && req.method === "POST") return await trackerUpsert(req, env);
      if (url.pathname === "/tracker/delete" && req.method === "POST") return await trackerDelete(req, env);
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, env, 500, req);
    }

    return json({ error: "not found" }, env, 404, req);
  },
};
