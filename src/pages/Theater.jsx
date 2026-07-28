import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Gate from "../lib/Gate.jsx";
import { WORKER, C, FONT, clamp, fmt, inputStyle, btnStyle } from "../lib/theater.js";

/**
 * Theater — watch the same film from two places.
 *
 * The sync model is worth understanding before reading the code. The server
 * never tells a client "play now". It publishes an anchor: position P was true
 * at server time T, and the state is playing. Each client works out where it
 * ought to be and steers itself there continuously.
 *
 * Steering, not jumping. A hard seek every time you drift 200ms would stutter
 * constantly. Instead small errors are absorbed by nudging playbackRate a few
 * percent — inaudible, invisible, and it converges in a couple of seconds.
 * Only a gap big enough that no amount of nudging would close it (>1.5s, i.e.
 * someone's laptop slept) gets a real seek.
 */

/* ================================================================== player */

function Player({ token, name, slug }) {
  const videoRef = useRef(null);
  const wsRef = useRef(null);

  // Server clock offset. Everything about sync depends on the two browsers
  // agreeing what "now" is, and their system clocks routinely differ by seconds.
  const offsetRef = useRef(0);
  const bestRttRef = useRef(Infinity);

  const stRef = useRef({ playing: false, pos: 0, at: Date.now(), waiting: false, rev: 0 });
  const [st, setSt] = useState(stRef.current);

  const [media, setMedia] = useState(null);
  const [err, setErr] = useState("");
  const [peers, setPeers] = useState([]);
  const [joined, setJoined] = useState(false);
  const [current, setCurrent] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [stalled, setStalled] = useState(false);
  const [drift, setDrift] = useState(0);
  const [volume, setVolume] = useState(() => Number(localStorage.getItem("theater.vol") ?? 1));
  const [subIdx, setSubIdx] = useState(-1);
  const [chat, setChat] = useState([]);
  const [chatText, setChatText] = useState("");
  const [uiVisible, setUiVisible] = useState(true);
  const hideTimer = useRef(null);

  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  const expectedPos = useCallback(() => {
    const s = stRef.current;
    return s.playing ? s.pos + (serverNow() - s.at) / 1000 : s.pos;
  }, [serverNow]);

  /* ------------------------------------------------------------- fetch media */

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch(`${WORKER}/media?m=${encodeURIComponent(slug)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json();
        if (dead) return;
        if (!r.ok) return setErr(j.error || "couldn't load the film");
        setMedia(j);
      } catch {
        if (!dead) setErr("couldn't reach storage");
      }
    })();
    return () => {
      dead = true;
    };
  }, [token, slug]);

  /* ---------------------------------------------------------------- socket */

  useEffect(() => {
    let closed = false;
    let retry = 0;
    let pingTimer;

    const connect = () => {
      if (closed) return;
      const url = `${WORKER.replace(/^http/, "ws")}/room?m=${encodeURIComponent(
        slug,
      )}&t=${encodeURIComponent(token)}&name=${encodeURIComponent(name)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retry = 0;
        ws.send(JSON.stringify({ t: "hello", name }));
        // Five rapid pings, then one every 10s. The burst converges the clock
        // estimate fast; the trickle keeps it honest as clocks wander.
        let n = 0;
        const ping = () => ws.readyState === 1 && ws.send(JSON.stringify({ t: "ping", c: Date.now() }));
        const burst = setInterval(() => {
          ping();
          if (++n >= 5) clearInterval(burst);
        }, 220);
        pingTimer = setInterval(ping, 10000);
      };

      ws.onmessage = (ev) => {
        const m = JSON.parse(ev.data);

        if (m.t === "pong") {
          // Only trust the fastest round trip seen. A sample that sat in a queue
          // gives a badly skewed offset, and one bad sample is worse than none.
          const rtt = Date.now() - m.c;
          if (rtt < bestRttRef.current) {
            bestRttRef.current = rtt;
            offsetRef.current = m.s + rtt / 2 - Date.now();
          }
          return;
        }

        if (m.t === "state") {
          // Server timestamps arrive on the server's clock; convert once, here,
          // so the rest of the component can work in local time.
          stRef.current = {
            playing: m.playing,
            pos: m.pos,
            at: m.at,
            waiting: m.waiting,
            rev: m.rev,
          };
          setSt(stRef.current);
          applyState(m);
          return;
        }

        if (m.t === "peers") return setPeers(m.peers);
        if (m.t === "chat") return setChat((c) => [...c.slice(-40), m]);
      };

      ws.onclose = () => {
        clearInterval(pingTimer);
        if (closed) return;
        retry = Math.min(retry + 1, 6);
        setTimeout(connect, 400 * 2 ** retry);
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      closed = true;
      clearInterval(pingTimer);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, slug, name]);

  const send = useCallback((msg) => {
    const ws = wsRef.current;
    if (ws?.readyState === 1) ws.send(JSON.stringify(msg));
  }, []);

  /* --------------------------------------------------------- state applier */

  const applyState = useCallback(
    (m) => {
      const v = videoRef.current;
      if (!v || !joined) return;
      const target = m.playing ? m.pos + (serverNow() - m.at) / 1000 : m.pos;

      if (Math.abs(v.currentTime - target) > 0.6) v.currentTime = target;

      if (m.playing && v.paused) v.play().catch(() => {});
      if (!m.playing && !v.paused) v.pause();

      // Gated on buffering: tell the server the moment we can actually play.
      if (m.waiting) {
        const report = () => send({ t: "ready", ready: true, pos: v.currentTime });
        if (v.readyState >= 3) report();
        else v.addEventListener("canplay", report, { once: true });
      }
    },
    [joined, send, serverNow],
  );

  /* ------------------------------------------------- the correction loop */

  useEffect(() => {
    if (!joined) return undefined;
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v || !v.duration) return;

      setCurrent(v.currentTime);
      const b = v.buffered;
      setBuffered(b.length ? b.end(b.length - 1) : 0);
      setStalled(v.readyState < 3);

      const s = stRef.current;
      const target = expectedPos();
      const d = v.currentTime - target;
      setDrift(d);

      if (!s.playing) {
        if (!v.paused) v.pause();
        if (Math.abs(d) > 0.25) v.currentTime = target;
        v.playbackRate = 1;
        return;
      }

      if (v.paused && v.readyState >= 3) v.play().catch(() => {});

      if (Math.abs(d) > 1.5) {
        // Too far gone to nudge — a laptop slept, or the network stalled hard.
        v.currentTime = target + 0.2;
        v.playbackRate = 1;
      } else if (Math.abs(d) > 0.09) {
        // Steer. Capped at ±6%, which is below the threshold where pitch shift
        // becomes noticeable in dialogue.
        v.playbackRate = clamp(1 - d * 0.35, 0.94, 1.06);
      } else {
        v.playbackRate = 1;
      }
    }, 250);
    return () => clearInterval(id);
  }, [joined, expectedPos]);

  /* -------------------------------------------------------------- controls */

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    send({ t: "cmd", action: stRef.current.playing ? "pause" : "play", pos: v.currentTime });
  }, [send]);

  const seekTo = useCallback((pos) => send({ t: "cmd", action: "seek", pos }), [send]);

  const duration = useCallback(
    () => videoRef.current?.duration || media?.duration || 0,
    [media],
  );

  const nudge = useCallback(
    (delta) => seekTo(clamp(expectedPos() + delta, 0, duration())),
    [seekTo, expectedPos, duration],
  );

  /* Autoplay policies block programmatic play() until the user has interacted.
     The join click is that interaction — play/pause immediately to bank it, so
     that later remote-driven plays aren't silently refused. */
  const join = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      await v.play();
      v.pause();
    } catch {
      /* fine — some browsers allow it anyway once muted state changes */
    }
    setJoined(true);
    send({ t: "ready", ready: true, pos: v.currentTime });
    applyState({ ...stRef.current, waiting: stRef.current.waiting });
  };

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.volume = volume;
    localStorage.setItem("theater.vol", String(volume));
  }, [volume]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v?.textTracks) return;
    for (let i = 0; i < v.textTracks.length; i++) {
      v.textTracks[i].mode = i === subIdx ? "showing" : "disabled";
    }
  }, [subIdx, media]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
      if (e.code === "ArrowLeft") nudge(-10);
      if (e.code === "ArrowRight") nudge(10);
      if (e.key === "f") videoRef.current?.parentElement?.requestFullscreen?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, nudge]);

  const showUi = () => {
    setUiVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), 2800);
  };

  const notReady = useMemo(() => peers.filter((p) => !p.ready), [peers]);
  const dur = duration();

  /* ----------------------------------------------------------------- render */

  if (err) {
    return (
      <Shell>
        <div style={{ color: C.red, fontSize: 14 }}>{err}</div>
      </Shell>
    );
  }
  if (!media) {
    return (
      <Shell>
        <div style={{ color: C.dim, fontSize: 14 }}>loading…</div>
      </Shell>
    );
  }

  return (
    <div
      style={{ minHeight: "100vh", background: "#000", color: C.text, fontFamily: FONT }}
      onMouseMove={showUi}
    >
      <div style={{ position: "relative", width: "100%", background: "#000" }}>
        <video
          ref={videoRef}
          src={media.video}
          crossOrigin="anonymous"
          playsInline
          preload="auto"
          onClick={togglePlay}
          style={{ width: "100%", maxHeight: "100vh", display: "block", cursor: "pointer" }}
        >
          {media.subtitles?.map((s, i) => (
            <track key={i} kind="subtitles" src={s.url} srcLang={s.lang} label={s.label} />
          ))}
        </video>

        {!joined && (
          <Overlay>
            <div style={{ fontSize: 15, marginBottom: 4 }}>{media.title}</div>
            <div style={{ fontSize: 13, color: C.dim, marginBottom: 20 }}>
              {peers.length > 1 ? "she's here" : "waiting for her…"}
            </div>
            <button onClick={join} style={{ ...btnStyle(false), width: 180 }}>
              join
            </button>
          </Overlay>
        )}

        {joined && st.waiting && (
          <Overlay dim>
            <div style={{ fontSize: 13.5, color: C.dim }}>
              {notReady.length
                ? `waiting for ${notReady.map((p) => p.name).join(", ")}…`
                : "buffering…"}
            </div>
          </Overlay>
        )}

        {joined && stalled && !st.waiting && (
          <div style={{ position: "absolute", top: 16, left: 16, fontSize: 12, color: C.amber }}>
            buffering
          </div>
        )}

        {/* controls */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "40px 18px 16px",
            background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
            opacity: uiVisible || !st.playing ? 1 : 0,
            transition: "opacity 260ms",
            pointerEvents: uiVisible || !st.playing ? "auto" : "none",
          }}
        >
          <Scrubber
            current={current}
            buffered={buffered}
            duration={dur}
            onSeek={seekTo}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
            <button onClick={togglePlay} style={iconBtn}>
              {st.playing ? "❚❚" : "▶"}
            </button>
            <button onClick={() => nudge(-10)} style={iconBtn}>
              −10
            </button>
            <button onClick={() => nudge(10)} style={iconBtn}>
              +10
            </button>

            <span style={{ fontSize: 12.5, color: C.dim, fontVariantNumeric: "tabular-nums" }}>
              {fmt(current)} / {fmt(dur)}
            </span>

            <div style={{ flex: 1 }} />

            {media.subtitles?.length > 0 && (
              <select
                value={subIdx}
                onChange={(e) => setSubIdx(Number(e.target.value))}
                style={selectStyle}
              >
                <option value={-1}>subs off</option>
                {media.subtitles.map((s, i) => (
                  <option key={i} value={i}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}

            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{ width: 80, accentColor: C.blue }}
            />

            <SyncDot drift={drift} playing={st.playing} peers={peers} />
          </div>
        </div>
      </div>

      <ChatBar
        chat={chat}
        text={chatText}
        setText={setChatText}
        onSend={() => {
          if (!chatText.trim()) return;
          send({ t: "chat", text: chatText });
          setChatText("");
        }}
        peers={peers}
      />
    </div>
  );
}

/* ------------------------------------------------------------ subcomponents */

const Shell = ({ children }) => (
  <div
    style={{
      minHeight: "100vh",
      background: C.bg,
      display: "grid",
      placeItems: "center",
      fontFamily: FONT,
    }}
  >
    {children}
  </div>
);

const Overlay = ({ children, dim }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      background: dim ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.72)",
      backdropFilter: "blur(3px)",
      textAlign: "center",
    }}
  >
    <div>{children}</div>
  </div>
);

function Scrubber({ current, buffered, duration, onSeek }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);

  const pick = (e) => {
    const r = ref.current.getBoundingClientRect();
    return clamp((e.clientX - r.left) / r.width, 0, 1) * duration;
  };

  return (
    <div
      ref={ref}
      onClick={(e) => onSeek(pick(e))}
      onMouseMove={(e) => setHover(pick(e))}
      onMouseLeave={() => setHover(null)}
      style={{ position: "relative", height: 16, cursor: "pointer", display: "flex", alignItems: "center" }}
    >
      <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: C.line2, borderRadius: 2 }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: `${(buffered / duration) * 100 || 0}%`,
          height: 3,
          background: "rgba(255,255,255,0.28)",
          borderRadius: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: `${(current / duration) * 100 || 0}%`,
          height: 3,
          background: C.blue,
          borderRadius: 2,
        }}
      />
      {hover !== null && (
        <div
          style={{
            position: "absolute",
            left: `${(hover / duration) * 100}%`,
            bottom: 18,
            transform: "translateX(-50%)",
            fontSize: 11,
            color: C.text,
            background: "rgba(0,0,0,0.8)",
            padding: "2px 6px",
            borderRadius: 5,
            pointerEvents: "none",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {fmt(hover)}
        </div>
      )}
    </div>
  );
}

/** Small honest readout of how far apart the two of you actually are. */
function SyncDot({ drift, playing, peers }) {
  const a = Math.abs(drift);
  const color = !playing ? C.dim2 : a < 0.15 ? C.green : a < 0.6 ? C.amber : C.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: C.dim }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {playing ? `${drift >= 0 ? "+" : ""}${drift.toFixed(2)}s` : "held"}
      </span>
      <span style={{ color: C.dim2 }}>· {peers.length} here</span>
    </div>
  );
}

function ChatBar({ chat, text, setText, onSend, peers }) {
  const endRef = useRef(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [chat]);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "18px 18px 40px" }}>
      <div style={{ fontSize: 11.5, color: C.dim2, marginBottom: 8 }}>
        {peers.map((p) => p.name).join(" · ")}
      </div>
      <div
        style={{
          maxHeight: 180,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginBottom: 10,
        }}
      >
        {chat.map((c, i) => (
          <div key={i} style={{ fontSize: 13.5 }}>
            <span style={{ color: C.dim2 }}>{c.from}</span>{" "}
            <span style={{ color: C.text }}>{c.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        placeholder="say something"
        style={inputStyle}
      />
    </div>
  );
}

const iconBtn = {
  background: "transparent",
  border: "none",
  color: C.text,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: FONT,
  padding: "4px 2px",
  minWidth: 28,
};

const selectStyle = {
  background: C.glass,
  border: `1px solid ${C.line}`,
  color: C.text,
  borderRadius: 8,
  padding: "4px 8px",
  fontSize: 12,
  fontFamily: FONT,
  outline: "none",
};

/* =================================================================== entry */

export default function Theater() {
  const [auth, setAuth] = useState(() => {
    const t = sessionStorage.getItem("theater.token");
    return t ? { token: t, name: localStorage.getItem("theater.name") || "you" } : null;
  });

  const slug = new URLSearchParams(window.location.search).get("m") || "movie";

  useEffect(() => {
    document.title = "•";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  if (!auth) return <Gate onUnlock={(token, name) => setAuth({ token, name })} />;
  return <Player token={auth.token} name={auth.name} slug={slug} />;
}
