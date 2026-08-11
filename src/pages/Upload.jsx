import { useCallback, useEffect, useRef, useState } from "react";
import Gate from "../lib/Gate.jsx";
import { C, FONT, api, bytes, btnStyle, inputStyle, readAuth } from "../lib/theater.js";

/**
 * /u — drop the prepared folder in, watch it go to R2.
 *
 * The file goes browser → R2 directly via presigned multipart URLs. It never
 * passes through the Worker, so a 9 GB upload costs about three Worker requests
 * rather than 9 GB of Worker bandwidth.
 *
 * Three things this has to survive, because a 9 GB upload on home internet will
 * hit all of them: a part failing (retried with backoff), the connection
 * dropping (resumable — the uploadId and finished parts are kept locally), and
 * the tab being closed (same). Only fully-completed parts are recorded, so a
 * resume never produces a corrupt object.
 */

const CONCURRENCY = 4;
const RETRIES = 4;
const RATE_WINDOW_MS = 15000; // trailing window for the speed readout

const sluggify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "movie";

const store = {
  key: (slug, f) => `theater.up.${slug}.${f.name}.${f.size}`,
  get(slug, f) {
    try {
      return JSON.parse(localStorage.getItem(this.key(slug, f)) || "null");
    } catch {
      return null;
    }
  },
  set(slug, f, v) {
    try {
      localStorage.setItem(this.key(slug, f), JSON.stringify(v));
    } catch {
      /* quota — resume just won't be available */
    }
  },
  clear(slug, f) {
    localStorage.removeItem(this.key(slug, f));
  },
};

/** PUT with progress. fetch() gives no upload progress events; XHR does. */
function put(url, blob, onLoaded, signal, label = "part") {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => onLoaded(e.loaded);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag");
        if (!etag) {
          // The PUT succeeded but the header is hidden from JS, so there's no
          // way to finalise the upload. Distinct from a failure, and otherwise
          // maddening to diagnose.
          reject(
            new Error(
              `${label}: upload succeeded but the ETag header is hidden. ` +
                'Add "etag" to ExposeHeaders in the R2 bucket CORS policy.',
            ),
          );
          return;
        }
        resolve(etag);
      } else {
        reject(new Error(`${label}: HTTP ${xhr.status} ${xhr.statusText || ""}`.trim()));
      }
    };
    // An XHR that reaches onerror got NO http response — the browser refused to
    // surface one. Two causes dominate, and they need different fixes, so name
    // both rather than saying "network error" and leaving them to guess.
    xhr.onerror = () =>
      reject(
        new Error(
          `${label}: no response from R2. Two likely causes — (1) the file changed ` +
            "on disk mid-upload, which happens if prepare.sh was still running when " +
            "you picked the folder; wait for it to finish and re-pick. (2) the bucket " +
            "CORS policy is missing PUT in AllowedMethods, or this origin " +
            `(${location.origin}) in AllowedOrigins. Check the Network tab for which.`,
        ),
      );
    xhr.ontimeout = () => reject(new Error(`${label}: timed out`));
    xhr.onabort = () => reject(new Error("aborted"));
    signal?.addEventListener("abort", () => xhr.abort());
    xhr.send(blob);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================================================================== screen */

function Uploader({ token }) {
  const [files, setFiles] = useState([]);
  const [slug, setSlug] = useState("movie");
  const [phase, setPhase] = useState("idle"); // idle | running | done | error
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(0);
  const [total, setTotal] = useState(0);
  const [rate, setRate] = useState(0);
  const [resumable, setResumable] = useState(null);
  const [dragging, setDragging] = useState(false);

  const abortRef = useRef(null);
  const loadedRef = useRef(new Map()); // partNumber -> bytes uploaded
  const baseRef = useRef(0); // bytes from parts finished before this run
  const samplesRef = useRef([]); // [{t, b}] for the windowed rate

  const movie = files.find((f) => f.name === "movie.mp4");
  const manifest = files.find((f) => f.name === "manifest.json");
  const subs = files.filter((f) => f.name.endsWith(".vtt"));
  const valid = !!movie && !!manifest;

  /* Read the manifest to prefill the slug from the film's own title. */
  useEffect(() => {
    if (!manifest) return;
    manifest
      .text()
      .then((t) => setSlug(sluggify(JSON.parse(t).title)))
      .catch(() => {});
  }, [manifest]);

  useEffect(() => {
    if (movie && slug) setResumable(store.get(slug, movie));
  }, [movie, slug]);

  const accept = useCallback((list) => {
    const arr = Array.from(list).filter((f) => f.size > 0);
    setFiles(arr);
    setPhase("idle");
    setMsg("");
  }, []);

  const onDrop = useCallback(
    async (e) => {
      e.preventDefault();
      setDragging(false);
      const out = [];
      const walk = async (entry, path = "") => {
        if (entry.isFile) {
          out.push(await new Promise((res) => entry.file(res)));
        } else if (entry.isDirectory) {
          const reader = entry.createReader();
          const entries = await new Promise((res) => reader.readEntries(res));
          for (const c of entries) await walk(c, `${path}/${entry.name}`);
        }
      };
      const items = Array.from(e.dataTransfer.items)
        .map((i) => i.webkitGetAsEntry?.())
        .filter(Boolean);
      if (items.length) {
        for (const it of items) await walk(it);
        accept(out);
      } else {
        accept(e.dataTransfer.files);
      }
    },
    [accept],
  );

  /* ---------------------------------------------------------------- upload */

  async function run(resume) {
    const ac = new AbortController();
    abortRef.current = ac;
    setPhase("running");
    setMsg("");
    loadedRef.current = new Map();

    const smallTotal = [manifest, ...subs].reduce((a, f) => a + f.size, 0);
    setTotal(movie.size + smallTotal);

    try {
      // Fail fast if the file is still being written.
      //
      // Comparing File.size wouldn't work — that's a snapshot taken when the
      // file was picked and never updates. The actual signal is that reading
      // throws once the file on disk no longer matches that snapshot, so read
      // the tail and let it throw here rather than 40 minutes in.
      try {
        await movie.slice(Math.max(0, movie.size - 1024)).arrayBuffer();
      } catch {
        throw new Error(
          "movie.mp4 changed on disk since you picked it — prepare.sh is probably " +
            'still running. Wait for it to print "done.", then re-pick the folder.',
        );
      }

      // 1. Small files first — if these fail, fail before spending an hour.
      setMsg("uploading manifest and subtitles…");
      let smallSent = 0;
      for (const f of [manifest, ...subs]) {
        const { url } = await api("/upload/simple", token, { slug, name: f.name });
        // Re-wrap as a typeless Blob so XHR sends no Content-Type.
        //
        // A File from the folder picker carries a type ("application/json",
        // "text/vtt"), and those are not CORS-safelisted content types, so the
        // browser preflights asking permission for the content-type header.
        // The movie parts avoid this by accident — file.slice() yields an empty
        // type — which is why a failure here hits the manifest first. R2 infers
        // content type from the key anyway, so nothing is lost.
        await put(url, new Blob([f]), () => {}, ac.signal, f.name);
        smallSent += f.size;
        setSent(smallSent);
      }
      baseRef.current = smallSent;

      // 2. The film, in parts.
      const prior = resume ? store.get(slug, movie) : null;
      setMsg(prior ? "resuming…" : "starting upload…");

      const plan = await api("/upload/create", token, {
        slug,
        name: movie.name,
        size: movie.size,
        uploadId: prior?.uploadId,
      });

      const done = new Map((prior?.done || []).map((p) => [p.n, p.etag]));
      baseRef.current = smallSent + done.size * plan.partSize;
      setSent(baseRef.current);

      const save = () =>
        store.set(slug, movie, {
          uploadId: plan.uploadId,
          key: plan.key,
          partSize: plan.partSize,
          done: [...done].map(([n, etag]) => ({ n, etag })),
        });
      save();

      // Rate over a trailing window, not since-start.
      //
      // Dividing by total elapsed time decays toward zero by construction and
      // makes a perfectly healthy upload look like it's dying. A window also
      // reflects reality better: cable uplinks burst then settle, so the number
      // people actually want is "how fast right now", not a lifetime average.
      samplesRef.current = [];
      const tick = setInterval(() => {
        const live = [...loadedRef.current.values()].reduce((a, b) => a + b, 0);
        const now = baseRef.current + live;
        setSent(now);

        const s = samplesRef.current;
        s.push({ t: Date.now(), b: now });
        const cutoff = Date.now() - RATE_WINDOW_MS;
        while (s.length > 2 && s[0].t < cutoff) s.shift();

        const dt = (s[s.length - 1].t - s[0].t) / 1000;
        const db = s[s.length - 1].b - s[0].b;
        if (dt >= 1) setRate(Math.max(0, db / dt));
      }, 500);

      // Fixed-size worker pool pulling from a shared cursor. Simpler than
      // chunking the list up front and it self-balances when one part is slow.
      let cursor = 0;
      const queue = Array.from({ length: plan.partCount }, (_, i) => i + 1).filter(
        (n) => !done.has(n),
      );

      const worker = async () => {
        for (;;) {
          const idx = cursor++;
          if (idx >= queue.length) return;
          const n = queue[idx];
          const start = (n - 1) * plan.partSize;
          const blob = movie.slice(start, Math.min(start + plan.partSize, movie.size));

          let lastErr;
          for (let attempt = 0; attempt < RETRIES; attempt++) {
            try {
              const etag = await put(
                plan.urls[n - 1],
                blob,
                (l) => loadedRef.current.set(n, l),
                ac.signal,
                `part ${n}/${plan.partCount}`,
              );
              done.set(n, etag);
              loadedRef.current.delete(n);
              baseRef.current += blob.size;
              save();
              lastErr = null;
              break;
            } catch (e) {
              lastErr = e;
              loadedRef.current.delete(n);
              if (ac.signal.aborted || /ETag header is hidden/.test(e.message)) throw e;
              await sleep(500 * 2 ** attempt);
            }
          }
          if (lastErr) throw lastErr;
        }
      };

      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
      clearInterval(tick);

      setMsg("finalising…");
      await api("/upload/complete", token, {
        key: plan.key,
        uploadId: plan.uploadId,
        parts: [...done].map(([n, etag]) => ({ n, etag })),
      });

      store.clear(slug, movie);
      setSent(movie.size + smallTotal);
      setPhase("done");
      setMsg("");
    } catch (e) {
      setPhase("error");
      setMsg(e.message || String(e));
    }
  }

  const pct = total ? Math.min(100, (sent / total) * 100) : 0;
  const eta = rate > 0 ? (total - sent) / rate : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: FONT,
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ fontSize: 13, letterSpacing: 0.4, color: C.dim2, marginBottom: 28 }}>
          ⌘ UPLOAD
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `1px dashed ${dragging ? C.blue : C.line2}`,
            background: dragging ? "rgba(10,132,255,0.06)" : C.glass,
            borderRadius: 14,
            padding: "34px 20px",
            textAlign: "center",
            transition: "all 160ms",
          }}
        >
          <div style={{ fontSize: 14, marginBottom: 6 }}>
            {files.length ? `${files.length} files` : "drop the out/ folder here"}
          </div>
          <div style={{ fontSize: 12.5, color: C.dim2, marginBottom: 14 }}>
            {files.length ? "" : "the folder prepare.sh made"}
          </div>
          <label style={{ ...btnStyle(false), display: "inline-block", width: "auto", padding: "8px 16px", marginTop: 0, cursor: "pointer" }}>
            choose folder
            <input
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              onChange={(e) => accept(e.target.files)}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {files.length > 0 && (
          <div style={{ marginTop: 18, fontSize: 13 }}>
            <Row ok={!!movie} label="movie.mp4" note={movie ? bytes(movie.size) : "missing"} />
            <Row ok={!!manifest} label="manifest.json" note={manifest ? "" : "missing"} />
            <Row
              ok={subs.length > 0}
              label={`${subs.length} subtitle track${subs.length === 1 ? "" : "s"}`}
              note={subs.length ? "" : "none found"}
              warn={subs.length === 0}
            />
          </div>
        )}

        {valid && (
          <>
            <div style={{ marginTop: 22, fontSize: 12.5, color: C.dim2, marginBottom: 6 }}>
              watch link will be /t?m=
            </div>
            <input
              value={slug}
              onChange={(e) => setSlug(sluggify(e.target.value))}
              style={inputStyle}
              disabled={phase === "running"}
            />

            {phase === "running" ? (
              <>
                <Progress pct={pct} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.dim, marginTop: 8 }}>
                  <span>
                    {bytes(sent)} / {bytes(total)} · {pct.toFixed(1)}%
                  </span>
                  <span>
                    {rate > 0 ? `${bytes(rate)}/s` : "…"}
                    {eta > 0 ? ` · ${Math.ceil(eta / 60)}m left` : ""}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: C.dim2, marginTop: 6 }}>{msg}</div>
                <button
                  onClick={() => abortRef.current?.abort()}
                  style={{ ...btnStyle(false), background: C.glass, color: C.dim }}
                >
                  stop
                </button>
              </>
            ) : phase === "done" ? (
              <div style={{ marginTop: 18 }}>
                <div style={{ color: C.green, fontSize: 14, marginBottom: 10 }}>uploaded.</div>
                <a
                  href={`/t?m=${slug}`}
                  style={{ color: C.blue, fontSize: 14, textDecoration: "none" }}
                >
                  open /t?m={slug} →
                </a>
              </div>
            ) : (
              <>
                <button onClick={() => run(!!resumable)} style={btnStyle(false)}>
                  {resumable ? "resume upload" : "upload"}
                </button>
                {resumable && (
                  <div style={{ fontSize: 12.5, color: C.amber, marginTop: 10 }}>
                    An unfinished upload of this file was found — resuming skips what already
                    landed.{" "}
                    <button
                      onClick={() => {
                        store.clear(slug, movie);
                        setResumable(null);
                      }}
                      style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", textDecoration: "underline", fontSize: 12.5, fontFamily: FONT }}
                    >
                      start over
                    </button>
                  </div>
                )}
              </>
            )}

            {phase === "error" && (
              <div style={{ marginTop: 14, fontSize: 13, color: C.red, lineHeight: 1.5 }}>{msg}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ ok, label, note, warn }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: ok ? C.green : warn ? C.amber : C.red,
          flexShrink: 0,
        }}
      />
      <span style={{ color: ok ? C.text : C.dim }}>{label}</span>
      <span style={{ marginLeft: "auto", color: C.dim2, fontSize: 12.5 }}>{note}</span>
    </div>
  );
}

function Progress({ pct }) {
  return (
    <div style={{ marginTop: 18, height: 4, background: C.line2, borderRadius: 2, overflow: "hidden" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: C.blue,
          borderRadius: 2,
          transition: "width 300ms",
        }}
      />
    </div>
  );
}

export default function Upload() {
  const [auth, setAuth] = useState(readAuth);
  useEffect(() => {
    document.title = "•";
  }, []);
  if (!auth) return <Gate label="⌘ UPLOAD" askName={false} onUnlock={(token) => setAuth({ token })} />;
  return <Uploader token={auth.token} />;
}
