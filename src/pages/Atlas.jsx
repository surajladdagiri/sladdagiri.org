import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  animate,
  useReducedMotion,
} from "framer-motion";
import { ROLES, LABS, PASS_HASH, DIGEST } from "../data/atlas";

/* ------------------------------------------------------------------ */
/*  tokens                                                             */
/* ------------------------------------------------------------------ */

const C = {
  bg: "#050506",
  text: "#f5f5f7",
  dim: "rgba(245,245,247,0.60)",
  dim2: "rgba(245,245,247,0.36)",
  line: "rgba(255,255,255,0.09)",
  line2: "rgba(255,255,255,0.16)",
  glass: "rgba(255,255,255,0.045)",
  blue: "#0a84ff",
  green: "#30d158",
  amber: "#ffd60a",
  red: "#ff453a",
  purple: "#bf5af2",
};

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif';

const EASE = [0.22, 0.61, 0.36, 1];
const SPRING = { type: "spring", stiffness: 380, damping: 34, mass: 0.9 };

const STORE = {
  applied: "atlas.applied.v1",
  saved: "atlas.saved.v1",
  notes: "atlas.notes.v1",
  custom: "atlas.custom.v1",
  unlocked: "atlas.session.v1",
  digest: "atlas.digest.v1",
};

const load = (k, fb) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fb;
  } catch {
    return fb;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* quota / private mode — non-fatal */
  }
};

async function sha256(text) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const scoreColor = (s) =>
  s >= 82 ? C.green : s >= 68 ? C.blue : s >= 55 ? C.amber : C.red;

const money = (r) =>
  r.smin
    ? `$${Math.round(r.smin / 1000)}k – $${Math.round(r.smax / 1000)}k`
    : null;

/* ------------------------------------------------------------------ */
/*  ambient background                                                 */
/* ------------------------------------------------------------------ */

function Aurora({ still }) {
  const blobs = [
    { c: "rgba(10,132,255,0.30)", s: 620, x: "-12%", y: "-14%", d: 0 },
    { c: "rgba(191,90,242,0.22)", s: 520, x: "68%", y: "6%", d: 3 },
    { c: "rgba(48,209,88,0.14)", s: 460, x: "24%", y: "58%", d: 6 },
  ];
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={
            still
              ? { opacity: 0.5 }
              : { opacity: [0.35, 0.6, 0.35], x: [0, 30, 0], y: [0, -26, 0] }
          }
          transition={
            still
              ? { duration: 0.6 }
              : { duration: 16, delay: b.d, repeat: Infinity, ease: "easeInOut" }
          }
          style={{
            position: "absolute",
            left: b.x,
            top: b.y,
            width: b.s,
            height: b.s,
            borderRadius: "50%",
            background: b.c,
            filter: "blur(120px)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 80% at 50% 0%, transparent 30%, rgba(5,5,6,0.85) 100%)",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  lock screen                                                        */
/* ------------------------------------------------------------------ */

function Lock({ onUnlock, still }) {
  const [val, setVal] = useState("");
  const [state, setState] = useState("idle"); // idle | checking | bad
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!val.trim()) return;
    setState("checking");
    const h = await sha256(val.trim().toLowerCase());
    if (h === PASS_HASH) {
      sessionStorage.setItem(STORE.unlocked, "1");
      onUnlock();
    } else {
      setState("bad");
      setVal("");
      setTimeout(() => setState("idle"), 1400);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(12px)", scale: 1.04 }}
      transition={{ duration: 0.5, ease: EASE }}
      style={{
        position: "relative",
        zIndex: 2,
        minHeight: "82vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        fontFamily: FONT,
      }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...SPRING, delay: 0.1 }}
        style={{
          width: 74,
          height: 74,
          borderRadius: 24,
          border: `1px solid ${C.line2}`,
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          display: "grid",
          placeItems: "center",
          marginBottom: 26,
        }}
      >
        <motion.svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          animate={
            state === "bad" && !still ? { rotate: [0, -9, 9, -6, 6, 0] } : {}
          }
          transition={{ duration: 0.45 }}
        >
          <rect
            x="4.5"
            y="10.5"
            width="15"
            height="10"
            rx="3"
            stroke={state === "bad" ? C.red : C.text}
            strokeWidth="1.6"
          />
          <path
            d="M8 10.5V7.8a4 4 0 1 1 8 0v2.7"
            stroke={state === "bad" ? C.red : C.text}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </motion.svg>
      </motion.div>

      <motion.h1
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.18 }}
        style={{
          fontSize: "clamp(30px,5vw,46px)",
          letterSpacing: "-0.04em",
          fontWeight: 650,
          margin: 0,
          textAlign: "center",
        }}
      >
        Atlas
      </motion.h1>

      <motion.p
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.26 }}
        style={{
          color: C.dim,
          marginTop: 10,
          marginBottom: 30,
          fontSize: 15,
          textAlign: "center",
        }}
      >
        Private workspace
      </motion.p>

      <motion.form
        onSubmit={submit}
        initial={{ y: 14, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          x: state === "bad" && !still ? [0, -11, 11, -7, 7, 0] : 0,
        }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.32 }}
        style={{ width: "min(360px, 92vw)" }}
      >
        <div style={{ position: "relative" }}>
          <input
            ref={inputRef}
            type="password"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Passphrase"
            aria-label="Passphrase"
            style={{
              width: "100%",
              padding: "16px 54px 16px 20px",
              borderRadius: 999,
              border: `1px solid ${state === "bad" ? C.red : C.line2}`,
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              color: C.text,
              fontSize: 16,
              fontFamily: FONT,
              outline: "none",
              transition: "border-color 200ms ease",
            }}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.93 }}
            aria-label="Unlock"
            style={{
              position: "absolute",
              right: 7,
              top: 7,
              width: 40,
              height: 40,
              borderRadius: 999,
              border: "none",
              background: val ? C.blue : "rgba(255,255,255,0.10)",
              color: "#fff",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              transition: "background 200ms ease",
            }}
          >
            {state === "checking" ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.35)",
                  borderTopColor: "#fff",
                }}
              />
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h13M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </motion.button>
        </div>
        <AnimatePresence>
          {state === "bad" && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                color: C.red,
                fontSize: 13.5,
                textAlign: "center",
                marginTop: 14,
              }}
            >
              Incorrect passphrase
            </motion.p>
          )}
        </AnimatePresence>
      </motion.form>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  primitives                                                         */
/* ------------------------------------------------------------------ */

function Counter({ to, delay = 0, still }) {
  const mv = useMotionValue(0);
  const [n, setN] = useState(still ? to : 0);
  useEffect(() => {
    if (still) {
      setN(to);
      return;
    }
    const un = mv.on("change", (v) => setN(Math.round(v)));
    const ctl = animate(mv, to, { duration: 1.15, delay, ease: EASE });
    return () => {
      un();
      ctl.stop();
    };
  }, [to, delay, mv, still]);
  return <>{n}</>;
}

function Ring({ value, size = 54, stroke = 4, still }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const col = scoreColor(value);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: still ? circ * (1 - value / 100) : circ }}
          whileInView={{ strokeDashoffset: circ * (1 - value / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: EASE }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontSize: size * 0.3,
          fontWeight: 640,
          letterSpacing: "-0.03em",
          color: col,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div
      style={{
        display: "inline-flex",
        padding: 4,
        borderRadius: 999,
        background: "rgba(255,255,255,0.055)",
        border: `1px solid ${C.line}`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              position: "relative",
              border: "none",
              background: "transparent",
              color: on ? "#0b0b0c" : C.dim,
              padding: "9px 17px",
              borderRadius: 999,
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONT,
              transition: "color 220ms ease",
              whiteSpace: "nowrap",
            }}
          >
            {on && (
              <motion.span
                layoutId="seg-pill"
                transition={SPRING}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 999,
                  background: "#f5f5f7",
                  zIndex: -1,
                }}
              />
            )}
            {o.label}
            {o.count != null && (
              <span style={{ opacity: 0.5, marginLeft: 6, fontSize: 12 }}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Pill({ children, tone }) {
  const map = {
    money: { c: "#a7f3b4", b: "rgba(48,209,88,0.30)", bg: "rgba(48,209,88,0.10)" },
    info: { c: "#bcdcff", b: "rgba(10,132,255,0.36)", bg: "rgba(10,132,255,0.12)" },
    plain: { c: C.dim, b: C.line, bg: "rgba(255,255,255,0.04)" },
  };
  const s = map[tone] || map.plain;
  return (
    <span
      style={{
        fontSize: 11.5,
        padding: "4px 10px",
        borderRadius: 999,
        color: s.c,
        border: `1px solid ${s.b}`,
        background: s.bg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  cards                                                              */
/* ------------------------------------------------------------------ */

function Card({ item, kind, onOpen, applied, saved, toggle, still, index }) {
  const [hover, setHover] = useState(false);
  const isLab = kind === "lab";
  const title = isLab ? item.name : item.title;
  const sub = isLab
    ? `${item.org} · ${item.pi}`
    : `${item.company} · ${item.loc || "San Diego, CA"}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: still ? 0 : 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: EASE, delay: Math.min(index, 8) * 0.03 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen(item, kind)}
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: 26,
        padding: "1.25rem 1.35rem",
        border: `1px solid ${hover ? C.line2 : C.line}`,
        background: hover
          ? "rgba(255,255,255,0.075)"
          : "rgba(255,255,255,0.042)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        transform: hover && !still ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hover ? "0 22px 60px rgba(0,0,0,0.45)" : "none",
        transition:
          "background 260ms ease, border-color 260ms ease, transform 260ms cubic-bezier(0.22,0.61,0.36,1), box-shadow 260ms ease",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16.5,
              fontWeight: 640,
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>
          <div style={{ color: C.dim, fontSize: 13.5, marginTop: 4 }}>{sub}</div>

          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginTop: 12,
            }}
          >
            {item.track && <Pill>{item.track}</Pill>}
            {!isLab && money(item) && <Pill tone="money">{money(item)}</Pill>}
            {!isLab && item.site && <Pill>{item.site}</Pill>}
            {(isLab || item.analyzed) && (
              <Pill tone="info">{isLab ? "Playbook" : "Full analysis"}</Pill>
            )}
            {applied && <Pill tone="money">{isLab ? "Emailed" : "Applied"}</Pill>}
          </div>
        </div>

        <Ring value={item.score} still={still} />
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 14,
          flexWrap: "wrap",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {item.url && (
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            style={btn(true)}
          >
            {isLab ? "Lab site" : "Listing"} ↗
          </motion.a>
        )}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => toggle("applied", item.id)}
          style={btn(false, applied)}
        >
          {applied ? (isLab ? "✓ Emailed" : "✓ Applied") : isLab ? "Mark emailed" : "Mark applied"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => toggle("saved", item.id)}
          style={btn(false, saved)}
        >
          {saved ? "★" : "☆"}
        </motion.button>
      </div>
    </motion.div>
  );
}

const btn = (primary, active) => ({
  appearance: "none",
  border: primary ? "1px solid transparent" : `1px solid ${active ? "rgba(48,209,88,0.45)" : C.line}`,
  background: primary
    ? "#f5f5f7"
    : active
    ? "rgba(48,209,88,0.16)"
    : "rgba(255,255,255,0.05)",
  color: primary ? "#0b0b0c" : active ? "#a7f3b4" : C.text,
  padding: "7px 14px",
  borderRadius: 999,
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  fontFamily: FONT,
});

/* ------------------------------------------------------------------ */
/*  detail sheet                                                       */
/* ------------------------------------------------------------------ */

function Sheet({ open, item, kind, onClose, notes, setNote, still }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
    };
  }, [open, onClose]);

  const isLab = kind === "lab";
  const a = item?.analysis;

  return (
    <AnimatePresence>
      {open && item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2000,
              background: "rgba(3,3,4,0.72)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          />
          <motion.div
            initial={{ y: still ? 0 : "100%", opacity: still ? 0 : 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: still ? 0 : "100%", opacity: still ? 0 : 1 }}
            transition={still ? { duration: 0.2 } : { type: "spring", stiffness: 300, damping: 34 }}
            style={{
              position: "fixed",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: 0,
              zIndex: 2001,
              width: "min(860px, 100vw)",
              maxHeight: "92vh",
              overflowY: "auto",
              borderRadius: "30px 30px 0 0",
              border: `1px solid ${C.line2}`,
              borderBottom: "none",
              background: "rgba(16,16,19,0.94)",
              backdropFilter: "blur(46px)",
              WebkitBackdropFilter: "blur(46px)",
              padding: "0 1.7rem 3rem",
              fontFamily: FONT,
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                paddingTop: 14,
                paddingBottom: 12,
                background:
                  "linear-gradient(180deg, rgba(16,16,19,0.98) 70%, rgba(16,16,19,0))",
                zIndex: 3,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 5,
                  borderRadius: 99,
                  background: "rgba(255,255,255,0.24)",
                  margin: "0 auto 14px",
                }}
              />
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2
                    style={{
                      fontSize: "clamp(21px,3.2vw,29px)",
                      letterSpacing: "-0.035em",
                      lineHeight: 1.15,
                      margin: 0,
                      fontWeight: 660,
                    }}
                  >
                    {isLab ? item.name : item.title}
                  </h2>
                  <p style={{ color: C.dim, margin: "6px 0 0", fontSize: 14.5 }}>
                    {isLab
                      ? `${item.org} · ${item.pi}`
                      : `${item.company} · ${item.loc || ""}${
                          money(item) ? " · " + money(item) : ""
                        }`}
                  </p>
                </div>
                <Ring value={item.score} size={58} still={still} />
                <button
                  onClick={onClose}
                  aria-label="Close"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    border: `1px solid ${C.line}`,
                    background: "rgba(255,255,255,0.06)",
                    color: C.text,
                    fontSize: 17,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" style={{ ...btn(true), marginBottom: 6 }}>
                {isLab ? "Open lab site" : "Open listing"} ↗
              </a>
            )}

            {isLab ? (
              <>
                <Section t="What the lab does">{item.does}</Section>
                <Section t="Why you fit">{item.why}</Section>
                <Section t="Project to build" box>{item.project}</Section>
                <Section t="Cold email" box mono>{item.email}</Section>
                <Section t="Contact" box>{item.contact}</Section>
              </>
            ) : a ? (
              <>
                <Verdict text={a.verdict} />
                <Section t={`Why this score — ${item.score}/100`}>{a.rationale}</Section>
                {a.keywords?.length > 0 && (
                  <ListSection t="Top 5 missing keywords" items={a.keywords} dot={C.blue} />
                )}
                {a.flags?.length > 0 && (
                  <ListSection t="Red flags in 10 seconds" items={a.flags} dot={C.red} />
                )}
                {a.rewrite?.length > 0 && (
                  <ListSection t="Rewritten experience — XYZ" items={a.rewrite} dot={C.green} />
                )}
                <Section t="ATS filter read" box>{a.ats}</Section>
                <Section t="Hiring manager, 200 resumes deep" box>{a.scan}</Section>
              </>
            ) : (
              <Section t="Analysis" box>
                Scored on title, company, level and salary band. The full recruiter
                breakdown needs the job description pulled from the listing — ask
                Claude to run the deep analysis on this role.
              </Section>
            )}

            <h3 style={h3}>Your notes</h3>
            <textarea
              value={notes[item.id] || ""}
              onChange={(e) => setNote(item.id, e.target.value)}
              placeholder="Recruiter names, dates, which resume version, follow-ups…"
              rows={6}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${C.line}`,
                borderRadius: 16,
                color: C.text,
                padding: "13px 15px",
                fontSize: 14,
                fontFamily: FONT,
                outline: "none",
                resize: "vertical",
              }}
            />
            <p style={{ color: C.dim2, fontSize: 12.5, marginTop: 8 }}>
              Saved automatically to this browser.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const h3 = {
  fontSize: 11.5,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: C.dim2,
  margin: "1.9rem 0 0.7rem",
  paddingBottom: 8,
  borderBottom: `1px solid ${C.line}`,
  fontWeight: 600,
};

function Section({ t, children, box, mono }) {
  return (
    <>
      <h3 style={h3}>{t}</h3>
      <div
        style={
          box
            ? {
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${C.line}`,
                borderRadius: 18,
                padding: "1rem 1.15rem",
              }
            : undefined
        }
      >
        <p
          style={{
            color: C.dim,
            fontSize: 14.5,
            lineHeight: 1.75,
            margin: 0,
            whiteSpace: mono ? "pre-wrap" : "normal",
          }}
        >
          {children}
        </p>
      </div>
    </>
  );
}

function ListSection({ t, items, dot }) {
  return (
    <>
      <h3 style={h3}>{t}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((x, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
            style={{ display: "flex", gap: 11, alignItems: "flex-start" }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 99,
                background: dot,
                marginTop: 8,
                flexShrink: 0,
              }}
            />
            <span style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.7 }}>{x}</span>
          </motion.div>
        ))}
      </div>
    </>
  );
}

function Verdict({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      style={{
        marginTop: 18,
        padding: "1rem 1.15rem",
        borderRadius: 18,
        border: "1px solid rgba(10,132,255,0.34)",
        background: "rgba(10,132,255,0.12)",
        color: "#cfe6ff",
        fontSize: 15,
        fontWeight: 560,
        lineHeight: 1.55,
      }}
    >
      {text}
    </motion.div>
  );
}


/* ------------------------------------------------------------------ */
/*  daily digest card                                                  */
/* ------------------------------------------------------------------ */

const REGIONS = [
  { id: "all", label: "Everywhere" },
  { id: "sd", label: "San Diego" },
  { id: "la", label: "Los Angeles" },
  { id: "bay", label: "Bay Area" },
  { id: "remote", label: "Remote" },
  { id: "out", label: "Out of state" },
];

function DigestCard({ still }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!DIGEST || !DIGEST.date) return;
    const seen = load(STORE.digest, {});
    if (seen.date !== DIGEST.date) setShow(true);
  }, []);

  const dismiss = () => {
    save(STORE.digest, { date: DIGEST.date });
    setShow(false);
  };

  const rows = Object.entries(DIGEST?.counts || {}).filter(([, v]) => v > 0);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: still ? 0 : 40, scale: still ? 1 : 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: still ? 0 : 30, scale: still ? 1 : 0.95 }}
          transition={still ? { duration: 0.2 } : { type: "spring", stiffness: 320, damping: 30 }}
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 1500,
            width: "min(330px, calc(100vw - 40px))",
            borderRadius: 26,
            border: `1px solid ${C.line2}`,
            background: "rgba(18,18,21,0.92)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            boxShadow: "0 28px 70px rgba(0,0,0,0.55)",
            padding: "1.15rem 1.25rem 1.05rem",
            fontFamily: FONT,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: C.dim2 }}>
                This morning
              </div>
              <div style={{ fontSize: 25, fontWeight: 660, letterSpacing: "-0.035em", marginTop: 5 }}>
                <Counter to={DIGEST.total_new || 0} still={still} /> new{" "}
                {DIGEST.total_new === 1 ? "role" : "roles"}
              </div>
            </div>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              style={{
                width: 28, height: 28, borderRadius: 999, flexShrink: 0,
                border: `1px solid ${C.line}`, background: "rgba(255,255,255,0.06)",
                color: C.dim, fontSize: 15, cursor: "pointer", lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
            {rows.length === 0 && (
              <div style={{ color: C.dim2, fontSize: 13.5 }}>
                No new roles since the last run.
              </div>
            )}
            {rows.map(([label, n], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: still ? 0 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.06, duration: 0.4, ease: EASE }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span style={{ color: C.dim, fontSize: 13.5 }}>{label}</span>
                <span
                  style={{
                    fontSize: 13, fontWeight: 650, color: C.text,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 999, padding: "2px 10px", minWidth: 30, textAlign: "center",
                  }}
                >
                  {n}
                </span>
              </motion.div>
            ))}
          </div>

          {DIGEST.analyzed > 0 && (
            <div style={{ color: C.dim2, fontSize: 12, marginTop: 13, lineHeight: 1.5 }}>
              {DIGEST.analyzed} analyzed by Claude, Gemini and ChatGPT.
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={dismiss}
            style={{ ...btn(true), width: "100%", justifyContent: "center", marginTop: 14 }}
          >
            Got it
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  main                                                               */
/* ------------------------------------------------------------------ */

export default function Atlas() {
  const reduce = useReducedMotion();
  const still = !!reduce;

  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(STORE.unlocked) === "1"
  );
  const [tab, setTab] = useState("roles");
  const [region, setRegion] = useState("all");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState(() => load(STORE.applied, {}));
  const [saved, setSaved] = useState(() => load(STORE.saved, {}));
  const [notes, setNotes] = useState(() => load(STORE.notes, {}));
  const [sheet, setSheet] = useState({ open: false, item: null, kind: "role" });

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 420], [0, still ? 0 : 70]);
  const heroFade = useTransform(scrollY, [0, 320], [1, still ? 1 : 0.15]);
  const heroYs = useSpring(heroY, { stiffness: 90, damping: 24 });

  useEffect(() => {
    document.title = "Atlas";
    const m = document.createElement("meta");
    m.name = "robots";
    m.content = "noindex, nofollow";
    document.head.appendChild(m);
    return () => document.head.removeChild(m);
  }, []);

  const toggle = (which, id) => {
    if (which === "applied") {
      const n = { ...applied, [id]: !applied[id] };
      setApplied(n);
      save(STORE.applied, n);
    } else {
      const n = { ...saved, [id]: !saved[id] };
      setSaved(n);
      save(STORE.saved, n);
    }
  };
  const setNote = (id, v) => {
    const n = { ...notes, [id]: v };
    setNotes(n);
    save(STORE.notes, n);
  };

  const list = useMemo(() => {
    const base =
      tab === "labs"
        ? LABS
        : tab === "applied"
        ? [...ROLES, ...LABS].filter((x) => applied[x.id])
        : tab === "saved"
        ? [...ROLES, ...LABS].filter((x) => saved[x.id])
        : tab === "top"
        ? [...ROLES, ...LABS].filter((x) => x.score >= 78)
        : ROLES;
    const geoFiltered =
      region === "all" ? base : base.filter((x) => !x.geo || x.geo === region);
    const s = q.trim().toLowerCase();
    const f = s
      ? geoFiltered.filter((x) =>
          `${x.title || x.name} ${x.company || x.org} ${x.pi || ""} ${x.track || ""}`
            .toLowerCase()
            .includes(s)
        )
      : geoFiltered;
    return [...f].sort((a, b) => b.score - a.score);
  }, [tab, q, applied, saved, region]);

  const kindOf = (x) => (x.pi ? "lab" : "role");

  const stats = [
    { n: ROLES.length, l: "Roles" },
    { n: LABS.length, l: "Labs" },
    { n: [...ROLES, ...LABS].filter((x) => x.score >= 78).length, l: "Strong" },
    { n: Object.values(applied).filter(Boolean).length, l: "Sent" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT, color: C.text }}>
      <Aurora still={still} />

      <AnimatePresence mode="wait">
        {!unlocked ? (
          <Lock key="lock" onUnlock={() => setUnlocked(true)} still={still} />
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, scale: still ? 1 : 1.02, filter: still ? "none" : "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: EASE }}
            style={{ position: "relative", zIndex: 2 }}
          >
            {/* hero */}
            <motion.section
              style={{
                y: heroYs,
                opacity: heroFade,
                maxWidth: 1180,
                margin: "0 auto",
                padding: "3.4rem 1.5rem 1.6rem",
              }}
            >
              <motion.h1
                initial={{ y: 26, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.75, ease: EASE, delay: 0.05 }}
                style={{
                  fontSize: "clamp(40px,7.5vw,84px)",
                  letterSpacing: "-0.055em",
                  lineHeight: 0.95,
                  margin: 0,
                  fontWeight: 680,
                  background: "linear-gradient(180deg,#ffffff 30%, rgba(255,255,255,0.55))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Atlas
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.75, ease: EASE, delay: 0.14 }}
                style={{
                  color: C.dim,
                  fontSize: "clamp(15px,1.9vw,18px)",
                  lineHeight: 1.65,
                  maxWidth: 620,
                  marginTop: 16,
                }}
              >
                Every role and research group worth your time in San Diego — scored,
                analyzed, and tracked in one place.
              </motion.p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(124px,1fr))",
                  gap: 12,
                  marginTop: 34,
                }}
              >
                {stats.map((s, i) => (
                  <motion.div
                    key={s.l}
                    initial={{ y: 22, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.22 + i * 0.07 }}
                    style={{
                      borderRadius: 22,
                      padding: "1.05rem 1.15rem",
                      border: `1px solid ${C.line}`,
                      background: "rgba(255,255,255,0.045)",
                      backdropFilter: "blur(30px)",
                      WebkitBackdropFilter: "blur(30px)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 660,
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                      }}
                    >
                      <Counter to={s.n} delay={0.35 + i * 0.07} still={still} />
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.13em",
                        color: C.dim2,
                        marginTop: 7,
                      }}
                    >
                      {s.l}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* controls */}
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 50,
                background: "rgba(5,5,6,0.72)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                borderBottom: `1px solid ${C.line}`,
                padding: "13px 1.5rem",
                marginTop: 26,
              }}
            >
              <div
                style={{
                  maxWidth: 1180,
                  margin: "0 auto",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Segmented
                  value={tab}
                  onChange={setTab}
                  options={[
                    { id: "roles", label: "Roles", count: ROLES.length },
                    { id: "labs", label: "Labs", count: LABS.length },
                    { id: "top", label: "Strong" },
                    { id: "applied", label: "Sent" },
                    { id: "saved", label: "Saved" },
                  ]}
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  style={{
                    flex: 1,
                    minWidth: 170,
                    padding: "11px 17px",
                    borderRadius: 999,
                    border: `1px solid ${C.line}`,
                    background: "rgba(255,255,255,0.05)",
                    color: C.text,
                    fontSize: 14,
                    fontFamily: FONT,
                    outline: "none",
                  }}
                />
              </div>

              <div
                style={{
                  maxWidth: 1180,
                  margin: "10px auto 0",
                  display: "flex",
                  gap: 7,
                  flexWrap: "wrap",
                }}
              >
                {REGIONS.map((r) => {
                  const on = region === r.id;
                  const n =
                    r.id === "all"
                      ? null
                      : ROLES.filter((x) => x.geo === r.id).length;
                  return (
                    <motion.button
                      key={r.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setRegion(r.id)}
                      style={{
                        border: `1px solid ${on ? "rgba(10,132,255,0.55)" : C.line}`,
                        background: on ? "rgba(10,132,255,0.16)" : "rgba(255,255,255,0.04)",
                        color: on ? "#cfe6ff" : C.dim,
                        padding: "6px 13px",
                        borderRadius: 999,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: FONT,
                        transition: "background 200ms ease, color 200ms ease, border-color 200ms ease",
                      }}
                    >
                      {r.label}
                      {n != null && (
                        <span style={{ opacity: 0.55, marginLeft: 6 }}>{n}</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* grid */}
            <div
              style={{
                maxWidth: 1180,
                margin: "0 auto",
                padding: "1.7rem 1.5rem 6rem",
              }}
            >
              <motion.div
                layout
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))",
                  gap: 14,
                }}
              >
                <AnimatePresence mode="popLayout">
                  {list.map((item, i) => (
                    <Card
                      key={item.id}
                      index={i}
                      item={item}
                      kind={kindOf(item)}
                      still={still}
                      applied={!!applied[item.id]}
                      saved={!!saved[item.id]}
                      toggle={toggle}
                      onOpen={(it, k) => setSheet({ open: true, item: it, kind: k })}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {list.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ textAlign: "center", color: C.dim2, padding: "4rem 0" }}
                >
                  Nothing here yet.
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {unlocked && <DigestCard still={still} />}

      <Sheet
        open={sheet.open}
        item={sheet.item}
        kind={sheet.kind}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
        notes={notes}
        setNote={setNote}
        still={still}
      />
    </div>
  );
}
