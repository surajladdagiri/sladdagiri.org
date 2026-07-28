/**
 * theater — the private half of the watch-together setup.
 *
 *   POST /auth             passphrase in, short-lived signed token out
 *   GET  /media            token in, presigned R2 URLs out
 *   GET  /room             token in, WebSocket to the sync Durable Object out
 *   POST /upload/*         presigned multipart upload, browser straight to R2
 *
 * Bulk bytes never pass through this Worker in either direction. Playback reads
 * from a presigned URL; uploads PUT to presigned URLs. The Worker only ever
 * handles small JSON, so a 9 GB upload and a two-hour film together cost a few
 * hundred requests against the free plan's 100k/day.
 */

import { AwsClient } from "aws4fetch";

export { Room } from "./room.js";

const TOKEN_TTL = 8 * 60 * 60; // seconds — long enough for a film and a pause
const URL_TTL = 8 * 60 * 60;
const UPLOAD_TTL = 24 * 60 * 60; // a 9 GB upload on home internet can run hours

const MIN_PART = 5 * 1024 * 1024; // S3/R2 floor
const DEFAULT_PART = 64 * 1024 * 1024;
const MAX_PARTS = 9000; // R2 allows 10k; leave headroom

/* ------------------------------------------------------------------ utils */

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

/**
 * Slugs and filenames go straight into an R2 key, so they get whitelisted.
 *
 * Stripping "/" alone already prevents traversal, but it leaves "../../etc" as
 * the literal prefix "....etc", which is confusing to find in a bucket and
 * invites doubt every time someone reads this. Collapsing runs of dots and
 * trimming leading punctuation makes the output boringly predictable.
 */
const safe = (s) =>
  String(s || "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.-]+/, "");

/**
 * Workers caps PBKDF2 at 100,000 iterations and throws NotSupportedError above
 * it — the cap exists to stop Workers being used as a DoS amplifier. Anything
 * higher fails in production with error 1101, and notably does NOT fail under
 * local `wrangler dev`, so this is only catchable against a real deploy.
 *
 * 100k is below OWASP's current SHA-256 guidance (600k), which is worth knowing:
 * the work factor here is capped by the platform, so passphrase length is doing
 * more of the security work than it would elsewhere. A short common word is
 * correspondingly weaker here than the iteration count alone suggests.
 *
 * Must stay in lockstep with scripts/theater/hash-pass.mjs — change one and
 * every existing passphrase stops verifying.
 */
const PBKDF2_ITERS = 100000;

async function pbkdf2(pass, saltB64) {
  const key = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: unb64url(saltB64), iterations: PBKDF2_ITERS },
    key,
    256,
  );
  return b64url(bits);
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
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
    await crypto.subtle.sign("HMAC", await hmacKey(env.TOKEN_SECRET), enc.encode(`${exp}.${nonce}`)),
  );
  return timingSafeEqual(sig, expected) ? { exp: Number(exp), nonce } : null;
}

function bearer(req) {
  const h = req.headers.get("Authorization") || "";
  if (h.startsWith("Bearer ")) return h.slice(7);
  return new URL(req.url).searchParams.get("t");
}

/* --------------------------------------------------------------- R2 (S3) */

const r2 = (env) =>
  new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });

const r2Base = (env) =>
  `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET || "theater"}`;

async function presign(env, key, ttl = URL_TTL, method = "GET", extraQuery = "") {
  const url = `${r2Base(env)}/${key}?X-Amz-Expires=${ttl}${extraQuery}`;
  const signed = await r2(env).sign(new Request(url, { method }), { aws: { signQuery: true } });
  return signed.url;
}

/* -------------------------------------------------------------------- CORS */

function corsHeaders(env, req) {
  const origin = req.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim());
  const ok =
    allowed.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin) || origin === "";
  return {
    "Access-Control-Allow-Origin": ok && origin ? origin : allowed[0] || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const json = (env, req, data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders(env, req),
    },
  });

/* ------------------------------------------------------------------ routes */

async function handleAuth(req, env) {
  let pass = "";
  try {
    ({ pass } = await req.json());
  } catch {
    return json(env, req, { error: "bad request" }, 400);
  }
  if (typeof pass !== "string" || pass.length > 200) {
    return json(env, req, { error: "bad request" }, 400);
  }

  const got = await pbkdf2(pass, env.PASS_SALT);
  if (!timingSafeEqual(got, env.PASS_HASH)) {
    await new Promise((r) => setTimeout(r, 400));
    return json(env, req, { error: "nope" }, 401);
  }
  return json(env, req, { token: await mintToken(env), ttl: TOKEN_TTL });
}

async function handleMedia(req, env) {
  const slug = safe(new URL(req.url).searchParams.get("m") || env.THEATER_SLUG);
  if (!slug) return json(env, req, { error: "no movie selected" }, 400);

  const manifestObj = await env.MEDIA.get(`${slug}/manifest.json`);
  if (!manifestObj) return json(env, req, { error: `no manifest for "${slug}"` }, 404);
  const manifest = await manifestObj.json();

  return json(env, req, {
    title: manifest.title,
    duration: manifest.duration,
    video: await presign(env, `${slug}/${manifest.video}`),
    subtitles: await Promise.all(
      (manifest.subtitles || []).map(async (s) => ({
        label: s.label,
        lang: s.lang,
        url: await presign(env, `${slug}/${s.src}`),
      })),
    ),
  });
}

async function handleRoom(req, env) {
  if (req.headers.get("Upgrade") !== "websocket") {
    return new Response("expected websocket", { status: 426 });
  }
  if (!(await verifyToken(env, bearer(req)))) {
    return new Response("unauthorized", { status: 401 });
  }
  const slug = safe(new URL(req.url).searchParams.get("m")) || "default";
  return env.ROOM.get(env.ROOM.idFromName(slug)).fetch(req);
}

/* ------------------------------------------------------------------ upload */

/**
 * Part size is derived, not fixed. R2 caps a multipart upload at 10,000 parts
 * and requires every part but the last to be identical in size, so a hardcoded
 * 64 MB would silently cap uploads at 640 GB — fine here, but the derivation
 * costs nothing and removes the cliff entirely.
 */
function planParts(size) {
  let partSize = DEFAULT_PART;
  if (Math.ceil(size / partSize) > MAX_PARTS) {
    partSize = Math.ceil(size / MAX_PARTS / MIN_PART) * MIN_PART;
  }
  return { partSize, partCount: Math.max(1, Math.ceil(size / partSize)) };
}

async function uploadCreate(req, env) {
  const { slug, name, size, uploadId: existing } = await req.json();
  const key = `${safe(slug)}/${safe(name)}`;
  if (!safe(slug) || !safe(name)) return json(env, req, { error: "bad name" }, 400);
  if (!Number.isFinite(size) || size <= 0) return json(env, req, { error: "bad size" }, 400);

  // Resuming: the client kept the uploadId and which parts already landed, so
  // re-sign against the same upload rather than starting a new one. Presigned
  // URLs expire long before a stalled 9 GB upload does, which is exactly when
  // you least want to start over.
  let uploadId = existing;
  if (!uploadId) {
    const create = await r2(env).fetch(`${r2Base(env)}/${key}?uploads`, { method: "POST" });
    if (!create.ok) {
      return json(
        env,
        req,
        { error: `create failed: ${create.status} ${await create.text()}` },
        502,
      );
    }
    uploadId = (await create.text()).match(/<UploadId>([^<]+)<\/UploadId>/)?.[1];
    if (!uploadId) return json(env, req, { error: "no uploadId in R2 response" }, 502);
  }

  const { partSize, partCount } = planParts(size);
  const urls = [];
  for (let n = 1; n <= partCount; n++) {
    urls.push(
      await presign(
        env,
        key,
        UPLOAD_TTL,
        "PUT",
        `&partNumber=${n}&uploadId=${encodeURIComponent(uploadId)}`,
      ),
    );
  }
  return json(env, req, { key, uploadId, partSize, partCount, urls });
}

async function uploadComplete(req, env) {
  const { key, uploadId, parts } = await req.json();
  if (!key || !uploadId || !Array.isArray(parts) || !parts.length) {
    return json(env, req, { error: "bad request" }, 400);
  }
  const xml =
    "<CompleteMultipartUpload>" +
    parts
      .slice()
      .sort((a, b) => a.n - b.n)
      .map(
        (p) =>
          `<Part><PartNumber>${p.n}</PartNumber><ETag>"${String(p.etag).replace(/"/g, "")}"</ETag></Part>`,
      )
      .join("") +
    "</CompleteMultipartUpload>";

  const res = await r2(env).fetch(
    `${r2Base(env)}/${key}?uploadId=${encodeURIComponent(uploadId)}`,
    { method: "POST", body: xml },
  );
  const text = await res.text();
  // R2 can return 200 with an <Error> body on completion failure, so the status
  // alone isn't enough to trust.
  if (!res.ok || /<Error>/.test(text)) {
    return json(env, req, { error: `complete failed: ${text.slice(0, 300)}` }, 502);
  }
  return json(env, req, { ok: true, key });
}

async function uploadAbort(req, env) {
  const { key, uploadId } = await req.json();
  await r2(env).fetch(`${r2Base(env)}/${key}?uploadId=${encodeURIComponent(uploadId)}`, {
    method: "DELETE",
  });
  return json(env, req, { ok: true });
}

/** Single presigned PUT — for manifest.json and the small .vtt files. */
async function uploadSimple(req, env) {
  const { slug, name } = await req.json();
  if (!safe(slug) || !safe(name)) return json(env, req, { error: "bad name" }, 400);
  const key = `${safe(slug)}/${safe(name)}`;
  return json(env, req, { key, url: await presign(env, key, UPLOAD_TTL, "PUT") });
}

/* -------------------------------------------------------------------- main */

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, req) });
    }

    try {
      if (pathname === "/health") return json(env, req, { ok: true });
      if (pathname === "/auth" && req.method === "POST") return handleAuth(req, env);
      if (pathname === "/room") return handleRoom(req, env);

      // Everything below needs a valid token.
      const authed = await verifyToken(env, bearer(req));
      if (!authed) return json(env, req, { error: "unauthorized" }, 401);

      if (pathname === "/media") return handleMedia(req, env);
      if (pathname === "/upload/create" && req.method === "POST") return uploadCreate(req, env);
      if (pathname === "/upload/complete" && req.method === "POST") return uploadComplete(req, env);
      if (pathname === "/upload/abort" && req.method === "POST") return uploadAbort(req, env);
      if (pathname === "/upload/simple" && req.method === "POST") return uploadSimple(req, env);
    } catch (err) {
      return json(env, req, { error: String(err?.message || err) }, 500);
    }

    return json(env, req, { error: "not found" }, 404);
  },
};
