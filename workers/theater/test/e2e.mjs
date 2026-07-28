/**
 * e2e.mjs — exercises the Worker against a local wrangler dev instance.
 *
 *   npx wrangler dev --local --port 8787 &
 *   node test/e2e.mjs
 *
 * Covers what can be tested without reaching Cloudflare: auth, token
 * verification, presigning (pure crypto, no network), and the whole sync
 * protocol including the ready-gate and pause-on-disconnect. The multipart
 * create/complete calls do hit R2's S3 API, so they're skipped offline.
 */

const BASE = process.env.BASE || "http://localhost:8787";
const PASS = "correct horse battery staple";

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Every socket buffers from the moment it opens.
 *
 * Attaching a listener only when you start awaiting loses anything that
 * arrived in between — and the server deliberately sends state and peers
 * back to back, so that window is real. Buffering makes the assertions
 * order-independent, which is the only way this test isn't flaky.
 */
function tap(ws) {
  ws._buf = [];
  ws._waiters = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    ws._buf.push(m);
    for (const w of ws._waiters.slice()) {
      if (w.pred(m)) {
        ws._waiters.splice(ws._waiters.indexOf(w), 1);
        clearTimeout(w.timer);
        w.res(m);
      }
    }
  });
  return ws;
}

/**
 * `from` is the buffer length captured before the action under test. Without it
 * a stale match from earlier in the session satisfies the assertion and the
 * test passes for the wrong reason — the classic failure mode of buffered
 * protocol tests.
 */
function next(ws, pred, ms = 3000, from = 0) {
  const hit = ws._buf.slice(from).find(pred);
  if (hit) return Promise.resolve(hit);
  return new Promise((res, rej) => {
    const w = { pred, res };
    w.timer = setTimeout(() => {
      ws._waiters.splice(ws._waiters.indexOf(w), 1);
      rej(new Error("timeout waiting for message"));
    }, ms);
    ws._waiters.push(w);
  });
}

/** Did anything matching `pred` arrive after `from`? Used for negative assertions. */
const sawNothing = async (ws, pred, from, ms = 500) => {
  await wait(ms);
  return !ws._buf.slice(from).some(pred);
};

const mark = (ws) => ws._buf.length;

const open = (ws) =>
  new Promise((res, rej) => {
    tap(ws);
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });

console.log("\nauth");
const health = await (await fetch(`${BASE}/health`)).json();
ok("/health returns ok", health.ok === true);

const bad = await fetch(`${BASE}/auth`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ pass: "definitely wrong" }),
});
ok("wrong passphrase rejected", bad.status === 401, `got ${bad.status}`);

const good = await fetch(`${BASE}/auth`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ pass: PASS }),
});
const { token } = await good.json();
ok("correct passphrase returns a token", good.status === 200 && !!token);

const noTok = await fetch(`${BASE}/media?m=movie`);
ok("/media without token is 401", noTok.status === 401, `got ${noTok.status}`);

const forged = await fetch(`${BASE}/media?m=movie`, {
  headers: { Authorization: "Bearer 99999999999.abc.tampered" },
});
ok("forged token rejected", forged.status === 401, `got ${forged.status}`);

console.log("\npresigning");
const simple = await fetch(`${BASE}/upload/simple`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ slug: "movie", name: "manifest.json" }),
});
const sj = await simple.json();
ok("upload/simple returns a URL", simple.status === 200 && !!sj.url, JSON.stringify(sj).slice(0, 120));
ok("URL is signed", /X-Amz-Signature=/.test(sj.url || ""));
ok("URL carries an expiry", /X-Amz-Expires=/.test(sj.url || ""));
ok("path traversal stripped from slug", !/\.\./.test(sj.key || ""));

const eviltest = await fetch(`${BASE}/upload/simple`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ slug: "../../etc", name: "passwd" }),
});
const ej = await eviltest.json();
ok("traversal slug sanitised", !String(ej.key || "").includes(".."), ej.key);

console.log("\nsync room");
const url = `${BASE.replace("http", "ws")}/room?m=test&t=${encodeURIComponent(token)}`;
const A = new WebSocket(`${url}&name=suraj`);
await open(A);
A.send(JSON.stringify({ t: "hello", name: "suraj" }));
const st0 = await next(A, (m) => m.t === "state");
ok("first client receives state", st0.playing === false);

const pong = await (async () => {
  A.send(JSON.stringify({ t: "ping", c: Date.now() }));
  return next(A, (m) => m.t === "pong");
})();
ok("clock sync pong echoes client time", typeof pong.c === "number" && typeof pong.s === "number");

const B = new WebSocket(`${url}&name=her`);
await open(B);
B.send(JSON.stringify({ t: "hello", name: "her" }));
await next(B, (m) => m.t === "state");
const peers = await next(A, (m) => m.t === "peers" && m.peers.length === 2);
ok("both peers visible in room", peers.peers.length === 2);

// play
let mk = mark(B);
A.send(JSON.stringify({ t: "cmd", action: "play", pos: 0 }));
const playB = await next(B, (m) => m.t === "state" && m.action === "play", 3000, mk);
ok("play broadcasts to the other client", playB.playing === true, JSON.stringify(playB));

// A seek should stop playback until BOTH clients say they've buffered.
await wait(150);
mk = mark(A);
B.send(JSON.stringify({ t: "cmd", action: "seek", pos: 600 }));
const seekA = await next(A, (m) => m.t === "state" && m.action === "seek", 3000, mk);
ok("seek broadcasts new position", Math.abs(seekA.pos - 600) < 0.01, `pos=${seekA.pos}`);
ok("seek holds playback while buffering", seekA.playing === false && seekA.waiting === true);

// One client ready is not enough — this is the assertion that matters, because
// getting it wrong means one of them silently watches ahead of the other.
mk = mark(A);
A.send(JSON.stringify({ t: "ready", ready: true, pos: 600 }));
ok(
  "one client ready does NOT resume",
  await sawNothing(A, (m) => m.t === "state" && m.playing === true, mk, 600),
);

mk = mark(A);
B.send(JSON.stringify({ t: "ready", ready: true, pos: 600 }));
const resumed = await next(A, (m) => m.t === "state" && m.playing === true, 4000, mk).catch(
  () => null,
);
ok("resumes once both are ready", !!resumed && resumed.waiting === false);
ok("resumes from the seeked position", !!resumed && Math.abs(resumed.pos - 600) < 0.2);

// chat
mk = mark(A);
B.send(JSON.stringify({ t: "chat", text: "hi" }));
const chat = await next(A, (m) => m.t === "chat", 3000, mk);
ok("chat relays with sender name", chat.text === "hi" && chat.from === "her");

// disconnect pauses, so nobody watches on alone
mk = mark(A);
B.close();
const paused = await next(A, (m) => m.t === "state" && m.playing === false, 4000, mk).catch(
  () => null,
);
ok("pauses when a peer drops", !!paused);
A.close();

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
