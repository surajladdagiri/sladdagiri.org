import { useMemo, useState } from "react";
import { T, Eyebrow, Tag } from "../theme";
import Reveal from "../Reveal";
import Tilt from "../Tilt";
import { LABS, INSTITUTIONS, TOPICS, STAFF_RA } from "../data/labs";

/* Atlas — a public, searchable map of San Diego research labs. Rebuilt from a
   private job tracker into an open explorer of the labs I'd want to work in. */

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: T.mono,
        fontSize: 12,
        letterSpacing: "0.03em",
        padding: "7px 12px",
        borderRadius: 999,
        cursor: "pointer",
        whiteSpace: "nowrap",
        border: `1px solid ${active ? T.accent : T.rule}`,
        background: active ? "rgba(255,107,53,0.14)" : "transparent",
        color: active ? T.ink : T.dim,
        transition: "border-color 140ms ease, color 140ms ease, background 140ms ease",
      }}
    >
      {children}
    </button>
  );
}

function Stars({ n }) {
  return (
    <span style={{ fontFamily: T.mono, fontSize: 13, letterSpacing: 1 }} title={`Fit ${n}/3`}>
      <span style={{ color: T.accent }}>{"●".repeat(n)}</span>
      <span style={{ color: T.rule }}>{"●".repeat(3 - n)}</span>
    </span>
  );
}

function LabCard({ lab }) {
  return (
    <Tilt max={5} style={{ height: "100%" }}>
      <article
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: T.surface,
          border: `1px solid ${T.rule}`,
          borderRadius: T.radius,
          padding: "20px 20px 18px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: T.dim }}>
            {lab.institution}
          </div>
          <Stars n={lab.fit} />
        </div>

        <h3 style={{ fontFamily: T.display, fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 2px", lineHeight: 1.2 }}>
          {lab.lab}
        </h3>
        <div style={{ fontFamily: T.body, fontSize: 13.5, color: T.dim, marginBottom: 14 }}>{lab.pi}</div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, alignItems: "center" }}>
          {lab.topics.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
          {STAFF_RA.has(lab.id) && (
            <span
              title="Estimated to hire full-time (non-student) research associates"
              style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.03em", color: T.accent2, border: `1px solid ${T.rule}`, borderRadius: 3, padding: "3px 8px" }}
            >
              Hires RAs
            </span>
          )}
        </div>

        <p style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.6, color: T.dim, margin: "0 0 14px" }}>
          {lab.what}
        </p>

        <div style={{ marginTop: "auto" }}>
          <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 14, marginBottom: 14 }}>
            <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: T.accent }}>
              Why I fit
            </span>
            <p style={{ fontFamily: T.body, fontSize: 14, lineHeight: 1.55, color: T.ink, margin: "6px 0 0" }}>{lab.you}</p>
          </div>
          <a
            href={lab.url}
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: T.mono, fontSize: 12.5, color: T.accent, textDecoration: "none" }}
          >
            Lab site
          </a>
        </div>
      </article>
    </Tilt>
  );
}

export default function Atlas() {
  const [q, setQ] = useState("");
  const [inst, setInst] = useState("all");
  const [topic, setTopic] = useState("all");
  const [minFit, setMinFit] = useState(0);
  const [raOnly, setRaOnly] = useState(false);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return LABS.filter((l) => {
      if (inst !== "all" && l.institution !== inst) return false;
      if (topic !== "all" && !l.topics.includes(topic)) return false;
      if (l.fit < minFit) return false;
      if (raOnly && !STAFF_RA.has(l.id)) return false;
      if (s) {
        const hay = `${l.lab} ${l.pi} ${l.institution} ${l.what} ${l.you} ${l.topics.join(" ")}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    }).sort((a, b) => b.fit - a.fit || a.institution.localeCompare(b.institution));
  }, [q, inst, topic, minFit, raOnly]);

  const input = {
    width: "100%",
    background: T.surface,
    border: `1px solid ${T.rule}`,
    borderRadius: T.radius,
    color: T.ink,
    fontFamily: T.body,
    fontSize: 15,
    padding: "12px 14px",
    outline: "none",
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
      <div style={{ maxWidth: T.maxW, margin: "0 auto", padding: "56px 24px 100px" }}>
        {/* header */}
        <Reveal>
          <Eyebrow n="◦" style={{ marginBottom: 16 }}>
            Atlas · San Diego research labs
          </Eyebrow>
          <h1 style={{ fontFamily: T.display, fontSize: "clamp(34px, 6vw, 66px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.0, margin: "0 0 18px" }}>
            Where I&apos;d want to work
          </h1>
          <p style={{ fontFamily: T.body, fontSize: 16.5, lineHeight: 1.7, color: T.dim, maxWidth: 640, margin: "0 0 34px" }}>
            A map of research labs across San Diego, filtered to the ones that
            fit what I build. Each lists what they work on, why I&apos;d be a fit,
            and where to find them. Dots show how close the match is.
          </p>
        </Reveal>

        {/* controls */}
        <div style={{ marginBottom: 14 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search labs, people, topics…" style={input} />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <Chip active={inst === "all"} onClick={() => setInst("all")}>All institutions</Chip>
          {INSTITUTIONS.map((i) => (
            <Chip key={i} active={inst === i} onClick={() => setInst(i)}>{i}</Chip>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <Chip active={topic === "all"} onClick={() => setTopic("all")}>All topics</Chip>
          {TOPICS.map((t) => (
            <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>{t}</Chip>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10, alignItems: "center" }}>
          <Chip active={minFit === 0} onClick={() => setMinFit(0)}>Any fit</Chip>
          <Chip active={minFit === 2} onClick={() => setMinFit(2)}>Good fit +</Chip>
          <Chip active={minFit === 3} onClick={() => setMinFit(3)}>Strong fit only</Chip>
          <Chip active={raOnly} onClick={() => setRaOnly((v) => !v)}>Hires full-time RAs</Chip>
          <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 12, color: T.dim }}>
            {results.length} {results.length === 1 ? "lab" : "labs"}
          </span>
        </div>
        <p style={{ fontFamily: T.mono, fontSize: 11, color: T.faint, margin: "0 0 28px" }}>
          &quot;Hires full-time RAs&quot; is an estimate from institution type and hiring norms — verify with the lab.
        </p>

        {/* grid */}
        {results.length === 0 ? (
          <p style={{ fontFamily: T.mono, fontSize: 13, color: T.faint }}>No labs match those filters.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
            {results.map((l) => (
              <Reveal key={l.id} y={16}>
                <LabCard lab={l} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
