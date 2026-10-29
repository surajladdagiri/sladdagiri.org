import { useCallback, useEffect, useMemo, useState } from "react";
import { T, Eyebrow, Tag, Rule } from "../theme";
import { ANALYTICS_URL } from "../analytics";

/* Atlas — a PRIVATE application tracker for jobs and research labs. Not linked
   anywhere, not in the sitemap, noindex. View / add / edit / delete entries from
   the UI; data is stored in the D1-backed Worker (same one as analytics). Reads
   and writes require the admin login (reused from the dashboard).

   Lab entries imported from the outreach research carry extra fields: pi,
   fitScore + scores {skills, projects, alignment, readiness}, fitRank,
   outreachRank, recommendation, connection, employment, vacancy, rationale,
   summary + sections[] (markdown), sources[], flags[]. Hand-made entries can
   leave all of those empty. See TRACKER.md for the schema. */

const TOKEN_KEY = "atlas.token.v1";

const STATUS = {
  interested: { label: "Interested", color: T.dim },
  to_apply: { label: "To apply", color: T.accent2 },
  applied: { label: "Applied", color: T.accent },
  interviewing: { label: "Interviewing", color: T.accent },
  offer: { label: "Offer", color: T.green },
  rejected: { label: "Rejected", color: T.red },
  closed: { label: "Closed", color: T.faint },
};
const STATUS_ORDER = ["interested", "to_apply", "applied", "interviewing", "offer", "rejected", "closed"];
const PRIORITY = ["high", "medium", "low"];
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };
const SUB = [
  ["skills", "Skills", 30],
  ["projects", "Projects", 25],
  ["alignment", "Alignment", 20],
  ["readiness", "Readiness", 25],
];

// A posting lead: the vacancy/employment notes mention a specific ad or requisition
// and don't say the lab has no openings. A rough text heuristic, labeled as such.
const POSTING_RE = /RESEA\d+|R-\d{3,}|requisition|advertis|posting|listing/i;
const CLOSED_RE = /states no openings|says no openings|no openings|not actively seeking/i;
const hasPostingLead = (e) => {
  const t = `${e.vacancy || ""} ${e.employment || ""}`;
  return POSTING_RE.test(t) && !CLOSED_RE.test(e.vacancy || "");
};

const SORTS = {
  fitScore: { label: "Fit score", dir: "desc", get: (e) => e.fitScore ?? -1 },
  outreachRank: { label: "Outreach rank", dir: "asc", get: (e) => e.outreachRank ?? 1e9 },
  fitRank: { label: "Fit rank", dir: "asc", get: (e) => e.fitRank ?? 1e9 },
  readiness: { label: "Readiness", dir: "desc", get: (e) => e.scores?.readiness ?? -1 },
  skills: { label: "Skills", dir: "desc", get: (e) => e.scores?.skills ?? -1 },
  projects: { label: "Projects", dir: "desc", get: (e) => e.scores?.projects ?? -1 },
  alignment: { label: "Alignment", dir: "desc", get: (e) => e.scores?.alignment ?? -1 },
  name: { label: "Name", dir: "asc", get: (e) => (e.name || "").toLowerCase() },
  org: { label: "Institution", dir: "asc", get: (e) => (e.org || "").toLowerCase() },
  status: { label: "Status", dir: "asc", get: (e) => STATUS_ORDER.indexOf(e.status) },
  priority: { label: "Priority", dir: "asc", get: (e) => PRIORITY_RANK[e.priority] ?? 1 },
  updated: { label: "Recently updated", dir: "desc", get: (e) => e.updated ?? 0 },
};

const BLANK = {
  type: "job", name: "", pi: "", org: "", role: "", location: "",
  status: "interested", priority: "medium", fit: 0,
  link: "", appliedDate: "", deadline: "", angle: "",
  projects: [], contacts: [], outreach: [], draftEmail: "", tags: [], notes: "",
};

/* ---------- shared styles ---------- */
const inputStyle = {
  width: "100%", background: T.bg2, border: `1px solid ${T.rule}`, borderRadius: T.radius,
  color: T.ink, fontFamily: T.body, fontSize: 14.5, padding: "10px 12px", outline: "none",
};
const labelStyle = { fontFamily: T.mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: T.dim, marginBottom: 6, display: "block" };
const btn = (variant = "ghost") => ({
  fontFamily: T.mono, fontSize: 12.5, letterSpacing: "0.03em", padding: "9px 14px", borderRadius: T.radius,
  cursor: "pointer", border: `1px solid ${variant === "solid" ? T.accent : variant === "danger" ? T.red : T.rule}`,
  background: variant === "solid" ? T.accent : "transparent",
  color: variant === "solid" ? T.accentInk : variant === "danger" ? T.red : T.ink,
  fontWeight: variant === "solid" ? 700 : 500,
});
const linkStyle = { color: T.accent2, textDecoration: "none" };
const scoreColor = (s) => (s >= 80 ? T.green : s >= 70 ? T.accent2 : s >= 60 ? T.accent : T.faint);

/* ---------- tiny markdown renderer (bold, code, links, lists, tables) ---------- */
function inlineMd(text, kb = "i") {
  const out = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*(.+?)\*\*|`([^`]+)`|(https?:\/\/[^\s)<]+)/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${kb}-${k++}`;
    if (m[1]) out.push(<a key={key} href={m[2]} target="_blank" rel="noreferrer" style={linkStyle}>{m[1]}</a>);
    else if (m[3]) out.push(<strong key={key} style={{ color: T.ink, fontWeight: 600 }}>{inlineMd(m[3], key)}</strong>);
    else if (m[4]) out.push(<code key={key} style={{ fontFamily: T.mono, fontSize: "0.92em", color: T.accent2 }}>{m[4]}</code>);
    else if (m[5]) {
      const url = m[5].replace(/[.,;]+$/, "");
      out.push(<a key={key} href={url} target="_blank" rel="noreferrer" style={linkStyle}>{url.replace(/^https?:\/\//, "")}</a>);
      if (url.length < m[5].length) out.push(m[5].slice(url.length));
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
function Md({ md }) {
  if (!md) return null;
  const blocks = md.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const p = { fontFamily: T.body, fontSize: 14.5, lineHeight: 1.65, color: T.dim, margin: "0 0 10px" };
  return (
    <div>
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => l.trim().startsWith("|"))) {
          const rows = lines.filter((l) => !/^\s*\|[\s:|-]+\|\s*$/.test(l)).map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
          return (
            <div key={i} style={{ overflowX: "auto", margin: "0 0 12px" }}>
              <table style={{ borderCollapse: "collapse", fontFamily: T.body, fontSize: 13, color: T.dim }}>
                <tbody>
                  {rows.map((r, j) => (
                    <tr key={j}>{r.map((c, x) => <td key={x} style={{ border: `1px solid ${T.rule}`, padding: "6px 8px", color: j === 0 ? T.ink : T.dim }}>{inlineMd(c, `${i}-${j}-${x}`)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (/^\s*[-*] /.test(lines[0])) {
          const items = [];
          for (const l of lines) {
            if (/^\s*[-*] /.test(l)) items.push(l.replace(/^\s*[-*] /, ""));
            else if (items.length) items[items.length - 1] += " " + l.trim();
          }
          return (
            <ul key={i} style={{ ...p, paddingLeft: 20 }}>
              {items.map((it, j) => <li key={j} style={{ marginBottom: 4 }}>{inlineMd(it, `${i}-${j}`)}</li>)}
            </ul>
          );
        }
        return <p key={i} style={p}>{inlineMd(lines.join(" "), String(i))}</p>;
      })}
    </div>
  );
}

/* ---------- small pieces ---------- */
function StatusPill({ status }) {
  const s = STATUS[status] || { label: status || "—", color: T.dim };
  return (
    <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: s.color, border: `1px solid ${s.color}`, borderRadius: 3, padding: "3px 8px", whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}
function ScoreBar({ score, width = 90 }) {
  if (score == null) return <span style={{ fontFamily: T.mono, fontSize: 12, color: T.faint }}>—</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: T.mono, fontSize: 13.5, fontWeight: 700, color: scoreColor(score), minWidth: 22, textAlign: "right" }}>{score}</span>
      <span style={{ width, height: 6, background: T.bg2, borderRadius: 3, overflow: "hidden" }}>
        <span style={{ display: "block", width: `${Math.max(0, Math.min(100, score))}%`, height: "100%", background: scoreColor(score) }} />
      </span>
    </span>
  );
}
function SubScores({ scores }) {
  if (!scores) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
      {SUB.map(([k, label, max]) => (
        <div key={k}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.mono, fontSize: 11, color: T.dim, marginBottom: 4 }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
            <span style={{ color: T.ink }}>{scores[k] ?? "—"}/{max}</span>
          </div>
          <div style={{ height: 5, background: T.bg2, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${((scores[k] || 0) / max) * 100}%`, height: "100%", background: T.accent2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: T.accent, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
function Mono({ children }) {
  return (
    <pre style={{ fontFamily: T.mono, fontSize: 12.5, lineHeight: 1.6, color: T.dim, background: T.bg2, border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "12px 14px", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {children}
    </pre>
  );
}
function Flag({ children }) {
  return <span style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: 3, padding: "2px 7px" }}>{children}</span>;
}
function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400); } catch { /* ignore */ } }}
      style={{ ...btn("ghost"), padding: "5px 10px", fontSize: 11.5 }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}
const P = ({ children }) => <p style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.65, color: T.dim, margin: 0 }}>{children}</p>;

/* ---------- detail panel (modal) ---------- */
function Detail({ e, onClose, onEdit, onDelete }) {
  useEffect(() => {
    const onKey = (ev) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const facts = [
    ["Recommendation", e.recommendation],
    ["Strongest connection", e.connection],
    ["Why this score", e.rationale],
    ["Hiring evidence", e.employment],
    ["Vacancy status", e.vacancy],
    ["Outreach status (from research)", e.outreachStatus],
  ].filter(([, v]) => v);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(6,6,10,0.72)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "4vh 14px", overflowY: "auto" }}>
      <div onClick={(ev) => ev.stopPropagation()} style={{ width: "100%", maxWidth: 860, background: T.surface, border: `1px solid ${T.ruleStrong}`, borderRadius: T.radius, padding: "22px 24px 26px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: e.type === "lab" ? T.accent2 : T.accent }}>{e.type === "lab" ? "Lab" : "Job"}</span>
              {e.org && <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: T.dim }}>{e.org}</span>}
              {(e.flags || []).map((f) => <Flag key={f}>{f}</Flag>)}
            </div>
            <h2 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 4px", lineHeight: 1.15 }}>{e.name}</h2>
            <div style={{ fontFamily: T.body, fontSize: 14.5, color: T.dim }}>{[e.pi, e.role, e.location].filter(Boolean).join(" · ")}</div>
            {e.tagline && <div style={{ fontFamily: T.body, fontSize: 14, color: T.faint, marginTop: 6 }}>{e.tagline}</div>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <StatusPill status={e.status} />
            <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "none", color: T.dim, fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
        </div>

        {(e.fitScore != null || e.outreachRank != null) && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(160px, 220px) 1fr", gap: 20, alignItems: "center", marginTop: 20, padding: "16px 18px", border: `1px solid ${T.rule}`, borderRadius: T.radius, background: T.bg2 }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.dim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Fit score</div>
              <div style={{ fontFamily: T.display, fontSize: 40, fontWeight: 700, color: scoreColor(e.fitScore ?? 0), lineHeight: 1.05 }}>{e.fitScore ?? "—"}<span style={{ fontSize: 16, color: T.faint }}>/100</span></div>
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.dim, marginTop: 6 }}>
                {e.fitRank != null && <>Fit rank #{e.fitRank}</>}{e.fitRank != null && e.outreachRank != null && " · "}{e.outreachRank != null && <>Outreach rank #{e.outreachRank}</>}
              </div>
            </div>
            <SubScores scores={e.scores} />
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 16 }}>
          {e.link && <a href={e.link} target="_blank" rel="noreferrer" style={{ ...linkStyle, fontFamily: T.mono, fontSize: 13 }}>{e.link.replace(/^https?:\/\//, "")}</a>}
          {e.priority && <span style={{ fontFamily: T.mono, fontSize: 12, color: T.faint }}>priority: {e.priority}</span>}
          {e.reviewed && <span style={{ fontFamily: T.mono, fontSize: 12, color: T.faint }}>researched {e.reviewed}</span>}
          {hasPostingLead(e) && <Flag>Mentions a posting</Flag>}
          {(e.tags || []).map((t) => <Tag key={t}>{t}</Tag>)}
          <span style={{ flex: 1 }} />
          <button onClick={onEdit} style={btn("ghost")}>Edit</button>
          <button onClick={onDelete} style={btn("danger")}>Delete</button>
        </div>

        {facts.length > 0 && (
          <div style={{ marginTop: 18, border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
            {facts.map(([k, v], i) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "minmax(130px, 190px) 1fr", gap: 14, padding: "12px 14px", borderTop: i ? `1px solid ${T.rule}` : "none" }}>
                <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.dim, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k}</div>
                <div style={{ fontFamily: T.body, fontSize: 14, lineHeight: 1.55, color: T.ink }}>{inlineMd(v, k)}</div>
              </div>
            ))}
          </div>
        )}

        {e.angle && (
          <Field label="Pitch">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}><Md md={e.angle} /></div>
              <CopyButton text={e.angle.replace(/^“|”$/g, "")} />
            </div>
          </Field>
        )}

        {e.contacts?.length > 0 && (
          <Field label="Contacts">
            <div style={{ display: "grid", gap: 8 }}>
              {e.contacts.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "baseline", border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "9px 12px" }}>
                  <span style={{ fontFamily: T.display, fontSize: 14.5, fontWeight: 500 }}>{[c.name, c.role].filter(Boolean).join(" · ") || "—"}</span>
                  {c.email && <a href={`mailto:${c.email}`} style={{ ...linkStyle, fontFamily: T.mono, fontSize: 13 }}>{c.email}</a>}
                  {c.email && <CopyButton text={c.email} />}
                  {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" style={{ ...linkStyle, fontFamily: T.mono, fontSize: 13 }}>LinkedIn</a>}
                  {c.note && <span style={{ fontFamily: T.body, fontSize: 13, color: T.dim }}>{c.note}</span>}
                </div>
              ))}
            </div>
          </Field>
        )}

        {e.outreach?.length > 0 && (
          <Field label="My outreach">
            <div style={{ display: "grid", gap: 10 }}>
              {e.outreach.map((o, i) => (
                <div key={i}>
                  <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.faint, marginBottom: 4 }}>{[o.channel, o.status, o.date].filter(Boolean).join(" · ")}</div>
                  {o.message && <Mono>{o.message}</Mono>}
                </div>
              ))}
            </div>
          </Field>
        )}
        {e.draftEmail && <Field label="Email I can send"><Mono>{e.draftEmail}</Mono></Field>}
        {e.notes && <Field label="Notes"><P>{e.notes}</P></Field>}
        {e.projects?.length > 0 && (
          <Field label="Projects to show fit">
            <ul style={{ margin: 0, paddingLeft: 18, fontFamily: T.body, fontSize: 14, lineHeight: 1.7, color: T.dim }}>
              {e.projects.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </Field>
        )}

        {(e.summary || e.sections?.length > 0) && (
          <Field label="Research notes">
            <div style={{ display: "grid", gap: 8 }}>
              {e.summary && (
                <details open style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "0 14px" }}>
                  <summary style={{ cursor: "pointer", padding: "11px 0", fontFamily: T.display, fontSize: 15, fontWeight: 600 }}>Overview</summary>
                  <div style={{ paddingBottom: 6 }}><Md md={e.summary} /></div>
                </details>
              )}
              {(e.sections || []).map((s, i) => (
                <details key={i} open={/small project/i.test(s.title)} style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "0 14px" }}>
                  <summary style={{ cursor: "pointer", padding: "11px 0", fontFamily: T.display, fontSize: 15, fontWeight: 600 }}>{s.title}</summary>
                  <div style={{ paddingBottom: 6 }}><Md md={s.md} /></div>
                </details>
              ))}
            </div>
          </Field>
        )}

        {e.sources?.length > 0 && (
          <Field label={`Sources (${e.sources.length})`}>
            <ul style={{ margin: 0, paddingLeft: 18, fontFamily: T.body, fontSize: 13.5, lineHeight: 1.75, color: T.dim }}>
              {e.sources.map((s, i) => (
                <li key={i}><a href={s.url} target="_blank" rel="noreferrer" style={linkStyle}>{s.label && s.label !== s.url ? s.label : s.url.replace(/^https?:\/\//, "")}</a></li>
              ))}
            </ul>
          </Field>
        )}
        {e.dataSource && <div style={{ fontFamily: T.mono, fontSize: 11, color: T.faint, marginTop: 18 }}>From: {e.dataSource}</div>}
      </div>
    </div>
  );
}

/* ---------- card view ---------- */
function EntryCard({ e, onOpen }) {
  return (
    <article onClick={onOpen} style={{ cursor: "pointer", background: T.surface, border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: T.dim, marginBottom: 3 }}>
            {[e.type === "lab" ? "Lab" : "Job", e.org].filter(Boolean).join(" · ")}
          </div>
          <h3 style={{ fontFamily: T.display, fontSize: 17.5, fontWeight: 600, letterSpacing: "-0.01em", margin: 0, lineHeight: 1.2 }}>{e.name}</h3>
          <div style={{ fontFamily: T.body, fontSize: 13, color: T.dim }}>{[e.pi, e.role].filter(Boolean).join(" · ")}</div>
        </div>
        <StatusPill status={e.status} />
      </div>
      {e.fitScore != null && <ScoreBar score={e.fitScore} width={120} />}
      {(e.rationale || e.angle) && (
        <p style={{ fontFamily: T.body, fontSize: 13.5, lineHeight: 1.55, color: T.dim, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {e.rationale || e.angle}
        </p>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontFamily: T.mono, fontSize: 11, color: T.faint }}>
        {e.fitRank != null && <span>fit #{e.fitRank}</span>}
        {e.outreachRank != null && <span>outreach #{e.outreachRank}</span>}
        {e.priority && <span>{e.priority}</span>}
        {hasPostingLead(e) && <span style={{ color: T.accent }}>posting</span>}
        {(e.flags || []).length > 0 && <span style={{ color: T.accent }}>⚑ {e.flags.length}</span>}
      </div>
    </article>
  );
}

/* ---------- table view ---------- */
function SortHead({ k, label, sort, setSort, align = "left", title }) {
  const active = sort.key === k;
  return (
    <th
      onClick={() => setSort(active ? { key: k, dir: sort.dir === "asc" ? "desc" : "asc" } : { key: k, dir: SORTS[k].dir })}
      title={title || `Sort by ${label}`}
      style={{ cursor: "pointer", textAlign: align, padding: "10px 10px", fontFamily: T.mono, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: active ? T.ink : T.dim, whiteSpace: "nowrap", userSelect: "none", borderBottom: `1px solid ${T.ruleStrong}` }}
    >
      {label}{active ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );
}
function Table({ rows, sort, setSort, onOpen }) {
  const td = { padding: "10px 10px", borderBottom: `1px solid ${T.rule}`, verticalAlign: "middle" };
  return (
    <div style={{ overflowX: "auto", border: `1px solid ${T.rule}`, borderRadius: T.radius }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
        <thead style={{ background: T.bg2 }}>
          <tr>
            <SortHead k="fitRank" label="Fit #" sort={sort} setSort={setSort} align="right" />
            <SortHead k="outreachRank" label="Out #" sort={sort} setSort={setSort} align="right" title="Outreach rank" />
            <SortHead k="name" label="Lab / company" sort={sort} setSort={setSort} />
            <SortHead k="org" label="Institution" sort={sort} setSort={setSort} />
            <SortHead k="fitScore" label="Fit score" sort={sort} setSort={setSort} />
            <SortHead k="skills" label="Sk" sort={sort} setSort={setSort} align="right" title="Skills /30" />
            <SortHead k="projects" label="Pr" sort={sort} setSort={setSort} align="right" title="Projects /25" />
            <SortHead k="alignment" label="Al" sort={sort} setSort={setSort} align="right" title="Alignment /20" />
            <SortHead k="readiness" label="Rd" sort={sort} setSort={setSort} align="right" title="Readiness /25" />
            <SortHead k="priority" label="Priority" sort={sort} setSort={setSort} />
            <SortHead k="status" label="Status" sort={sort} setSort={setSort} />
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id || e.name} onClick={() => onOpen(e)} style={{ cursor: "pointer" }}
              onMouseEnter={(ev) => (ev.currentTarget.style.background = "rgba(255,255,255,0.025)")}
              onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
              <td style={{ ...td, textAlign: "right", fontFamily: T.mono, fontSize: 12.5, color: T.dim }}>{e.fitRank ?? "—"}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: T.mono, fontSize: 12.5, color: T.dim }}>{e.outreachRank ?? "—"}</td>
              <td style={td}>
                <div style={{ fontFamily: T.display, fontSize: 14.5, fontWeight: 600, color: T.ink }}>
                  {e.name}{(e.flags || []).length > 0 && <span title={e.flags.join("; ")} style={{ color: T.accent, marginLeft: 6 }}>⚑</span>}
                  {hasPostingLead(e) && <span title="Vacancy notes mention a specific posting" style={{ fontFamily: T.mono, fontSize: 10, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: 3, padding: "1px 5px", marginLeft: 8, verticalAlign: "middle" }}>POSTING</span>}
                </div>
                <div style={{ fontFamily: T.body, fontSize: 12.5, color: T.dim }}>{[e.pi, e.type === "job" ? e.role : null].filter(Boolean).join(" · ")}</div>
              </td>
              <td style={{ ...td, fontFamily: T.body, fontSize: 13, color: T.dim, whiteSpace: "nowrap" }}>{e.org || "—"}</td>
              <td style={td}><ScoreBar score={e.fitScore} /></td>
              {SUB.map(([k]) => <td key={k} style={{ ...td, textAlign: "right", fontFamily: T.mono, fontSize: 12.5, color: T.dim }}>{e.scores?.[k] ?? "—"}</td>)}
              <td style={{ ...td, fontFamily: T.mono, fontSize: 12, color: e.priority === "high" ? T.accent2 : T.dim }}>{e.priority || "—"}</td>
              <td style={td}><StatusPill status={e.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- add/edit form (modal) ---------- */
function EntryForm({ initial, onCancel, onSave, saving }) {
  const [f, setF] = useState(() => ({
    ...BLANK, ...initial,
    scores: { ...(initial?.scores || {}) },
    projects: [...(initial?.projects || [])],
    contacts: (initial?.contacts || []).map((c) => ({ ...c })),
    outreach: (initial?.outreach || []).map((o) => ({ ...o })),
    tags: [...(initial?.tags || [])],
  }));
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setScore = (k, v) => setF((p) => ({ ...p, scores: { ...p.scores, [k]: v === "" ? undefined : Number(v) } }));
  const setArrObj = (key, i, field, v) => setF((p) => { const arr = p[key].map((it, idx) => (idx === i ? { ...it, [field]: v } : it)); return { ...p, [key]: arr }; });
  const addArrObj = (key, obj) => setF((p) => ({ ...p, [key]: [...p[key], obj] }));
  const delArr = (key, i) => setF((p) => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) }));
  const setProj = (i, v) => setF((p) => ({ ...p, projects: p.projects.map((x, idx) => (idx === i ? v : x)) }));

  const half = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
  const subSum = SUB.every(([k]) => typeof f.scores[k] === "number") ? SUB.reduce((a, [k]) => a + f.scores[k], 0) : null;
  const submit = () => {
    if (!f.name.trim()) return;
    const out = { ...f, fit: Number(f.fit) || 0 };
    if (f.fitScore === "" || f.fitScore == null) delete out.fitScore; else out.fitScore = Number(f.fitScore);
    if (!Object.values(out.scores).some((v) => typeof v === "number")) delete out.scores;
    onSave(out);
  };

  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 1600, background: "rgba(6,6,10,0.7)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 16px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 720, background: T.surface, border: `1px solid ${T.ruleStrong}`, borderRadius: T.radius, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontFamily: T.display, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>{initial?.id ? "Edit entry" : "New entry"}</h2>
          <button onClick={onCancel} aria-label="Close" style={{ background: "transparent", border: "none", color: T.dim, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Company or lab name" />
          </div>
          <div style={half}>
            <div><label style={labelStyle}>Type</label>
              <select style={inputStyle} value={f.type} onChange={(e) => set("type", e.target.value)}>
                <option value="job">Job</option><option value="lab">Lab</option>
              </select>
            </div>
            <div><label style={labelStyle}>Institution / organization</label>
              <input style={inputStyle} value={f.org} onChange={(e) => set("org", e.target.value)} placeholder="e.g. Salk Institute" />
            </div>
          </div>
          <div style={half}>
            <div><label style={labelStyle}>PI / hiring manager</label><input style={inputStyle} value={f.pi || ""} onChange={(e) => set("pi", e.target.value)} /></div>
            <div><label style={labelStyle}>Role</label><input style={inputStyle} value={f.role} onChange={(e) => set("role", e.target.value)} /></div>
          </div>
          <div style={half}>
            <div><label style={labelStyle}>Location</label><input style={inputStyle} value={f.location} onChange={(e) => set("location", e.target.value)} /></div>
            <div><label style={labelStyle}>Link</label><input style={inputStyle} value={f.link} onChange={(e) => set("link", e.target.value)} placeholder="https://" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Status</label>
              <select style={inputStyle} value={f.status} onChange={(e) => set("status", e.target.value)}>
                {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Priority</label>
              <select style={inputStyle} value={f.priority} onChange={(e) => set("priority", e.target.value)}>
                {PRIORITY.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* scores */}
          <div style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: 12 }}>
            <label style={labelStyle}>Fit score (0–100) and sub-scores</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              <div>
                <div style={{ ...labelStyle, fontSize: 10 }}>Total</div>
                <input type="number" min="0" max="100" style={inputStyle} value={f.fitScore ?? ""} onChange={(e) => set("fitScore", e.target.value)} placeholder={subSum != null ? String(subSum) : ""} />
              </div>
              {SUB.map(([k, label, max]) => (
                <div key={k}>
                  <div style={{ ...labelStyle, fontSize: 10 }}>{label} /{max}</div>
                  <input type="number" min="0" max={max} style={inputStyle} value={f.scores[k] ?? ""} onChange={(e) => setScore(k, e.target.value)} />
                </div>
              ))}
            </div>
            {subSum != null && Number(f.fitScore) !== subSum && (
              <button onClick={() => set("fitScore", subSum)} style={{ ...btn("ghost"), marginTop: 8, padding: "5px 10px", fontSize: 11.5 }}>Use sub-score total ({subSum})</button>
            )}
          </div>

          <div style={half}>
            <div><label style={labelStyle}>Applied date</label><input type="date" style={inputStyle} value={f.appliedDate} onChange={(e) => set("appliedDate", e.target.value)} /></div>
            <div><label style={labelStyle}>Deadline</label><input type="date" style={inputStyle} value={f.deadline} onChange={(e) => set("deadline", e.target.value)} /></div>
          </div>
          <div><label style={labelStyle}>Recommendation</label><input style={inputStyle} value={f.recommendation || ""} onChange={(e) => set("recommendation", e.target.value)} /></div>
          <div><label style={labelStyle}>Vacancy status</label><textarea style={{ ...inputStyle, minHeight: 52, resize: "vertical" }} value={f.vacancy || ""} onChange={(e) => set("vacancy", e.target.value)} /></div>
          <div><label style={labelStyle}>Pitch</label><textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} value={f.angle} onChange={(e) => set("angle", e.target.value)} /></div>
          <div><label style={labelStyle}>Tags (comma-separated)</label>
            <input style={inputStyle} value={(f.tags || []).join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
          </div>

          <div>
            <label style={labelStyle}>Projects to show fit</label>
            <div style={{ display: "grid", gap: 8 }}>
              {f.projects.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <input style={inputStyle} value={p} onChange={(e) => setProj(i, e.target.value)} />
                  <button onClick={() => delArr("projects", i)} style={btn("ghost")}>–</button>
                </div>
              ))}
              <button onClick={() => addArrObj("projects", "")} style={{ ...btn("ghost"), justifySelf: "start" }}>+ project</button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Contacts</label>
            <div style={{ display: "grid", gap: 10 }}>
              {f.contacts.map((c, i) => (
                <div key={i} style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: 12, display: "grid", gap: 8 }}>
                  <div style={half}>
                    <input style={inputStyle} placeholder="Name" value={c.name || ""} onChange={(e) => setArrObj("contacts", i, "name", e.target.value)} />
                    <input style={inputStyle} placeholder="Role" value={c.role || ""} onChange={(e) => setArrObj("contacts", i, "role", e.target.value)} />
                  </div>
                  <div style={half}>
                    <input style={inputStyle} placeholder="Email" value={c.email || ""} onChange={(e) => setArrObj("contacts", i, "email", e.target.value)} />
                    <input style={inputStyle} placeholder="LinkedIn URL" value={c.linkedin || ""} onChange={(e) => setArrObj("contacts", i, "linkedin", e.target.value)} />
                  </div>
                  <input style={inputStyle} placeholder="Note" value={c.note || ""} onChange={(e) => setArrObj("contacts", i, "note", e.target.value)} />
                  <button onClick={() => delArr("contacts", i)} style={{ ...btn("ghost"), justifySelf: "start" }}>Remove contact</button>
                </div>
              ))}
              <button onClick={() => addArrObj("contacts", { name: "", role: "", email: "", linkedin: "", note: "" })} style={{ ...btn("ghost"), justifySelf: "start" }}>+ contact</button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>My outreach</label>
            <div style={{ display: "grid", gap: 10 }}>
              {f.outreach.map((o, i) => (
                <div key={i} style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: 12, display: "grid", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <input style={inputStyle} placeholder="Channel" value={o.channel || ""} onChange={(e) => setArrObj("outreach", i, "channel", e.target.value)} />
                    <input style={inputStyle} placeholder="Status" value={o.status || ""} onChange={(e) => setArrObj("outreach", i, "status", e.target.value)} />
                    <input type="date" style={inputStyle} value={o.date || ""} onChange={(e) => setArrObj("outreach", i, "date", e.target.value)} />
                  </div>
                  <textarea style={{ ...inputStyle, minHeight: 56, resize: "vertical" }} placeholder="Message" value={o.message || ""} onChange={(e) => setArrObj("outreach", i, "message", e.target.value)} />
                  <button onClick={() => delArr("outreach", i)} style={{ ...btn("ghost"), justifySelf: "start" }}>Remove</button>
                </div>
              ))}
              <button onClick={() => addArrObj("outreach", { channel: "email", status: "draft", date: "", message: "" })} style={{ ...btn("ghost"), justifySelf: "start" }}>+ outreach</button>
            </div>
          </div>

          <div><label style={labelStyle}>Email I can send</label><textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={f.draftEmail} onChange={(e) => set("draftEmail", e.target.value)} /></div>
          <div><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          {initial?.sections?.length > 0 && (
            <p style={{ fontFamily: T.mono, fontSize: 11.5, color: T.faint, margin: 0 }}>The imported research notes and sources are kept as-is when you save.</p>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
          <button onClick={onCancel} style={btn("ghost")}>Cancel</button>
          <button onClick={submit} disabled={saving || !f.name.trim()} style={{ ...btn("solid"), opacity: saving || !f.name.trim() ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- login gate ---------- */
function Login({ onToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${ANALYTICS_URL}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (!r.ok) { setErr("Invalid credentials"); setBusy(false); return; }
      const d = await r.json();
      onToken(d.token);
    } catch { setErr("Network error"); setBusy(false); }
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 380, margin: "8vh auto 0", display: "grid", gap: 12 }}>
      <Eyebrow n="◦">Private · sign in</Eyebrow>
      <h1 style={{ fontFamily: T.display, fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", margin: "6px 0 10px" }}>Atlas</h1>
      <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
      <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      {err && <div style={{ fontFamily: T.mono, fontSize: 12, color: T.red }}>{err}</div>}
      <button type="submit" disabled={busy} style={{ ...btn("solid"), opacity: busy ? 0.6 : 1 }}>{busy ? "…" : "Sign in"}</button>
    </form>
  );
}

/* ---------- page ---------- */
export default function Atlas() {
  const [token, setToken] = useState(() => (typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null));
  const [data, setData] = useState({ loading: !!token, error: null, entries: [] });
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [org, setOrg] = useState("all");
  const [priority, setPriority] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [postingOnly, setPostingOnly] = useState(false);
  const [sort, setSort] = useState({ key: "fitScore", dir: "desc" });
  const [view, setView] = useState("table");
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null); // null | {} (new) | entry
  const [saving, setSaving] = useState(false);

  const logout = useCallback(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); setData({ loading: false, error: null, entries: [] }); }, []);
  const saveToken = (t) => { localStorage.setItem(TOKEN_KEY, t); setToken(t); };

  const load = useCallback(async (tok) => {
    setData((d) => ({ ...d, loading: true }));
    try {
      const r = await fetch(`${ANALYTICS_URL}/tracker`, { headers: { Authorization: `Bearer ${tok}` } });
      if (r.status === 401) { logout(); return; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setData({ loading: false, error: null, entries: Array.isArray(d.entries) ? d.entries : [] });
    } catch (e) { setData({ loading: false, error: String(e), entries: [] }); }
  }, [logout]);

  useEffect(() => { if (token) load(token); }, [token, load]);

  const saveEntry = async (entry) => {
    setSaving(true);
    try {
      const r = await fetch(`${ANALYTICS_URL}/tracker`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(entry) });
      if (r.status === 401) { logout(); return; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setEditing(null);
      await load(token);
    } catch (e) { alert("Save failed: " + e); } finally { setSaving(false); }
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm(`Delete "${entry.name}"? This can't be undone.`)) return;
    try {
      const r = await fetch(`${ANALYTICS_URL}/tracker/delete`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: entry.id }) });
      if (r.status === 401) { logout(); return; }
      setOpenId(null);
      await load(token);
    } catch (e) { alert("Delete failed: " + e); }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ entries: data.entries }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "tracker.json"; a.click();
    URL.revokeObjectURL(url);
  };

  // lower-cased search text per entry, built once per load
  const hay = useMemo(() => new Map(data.entries.map((e) => [e, JSON.stringify(e).toLowerCase()])), [data.entries]);
  const orgs = useMemo(() => {
    const c = {};
    for (const e of data.entries) if (e.org) c[e.org] = (c[e.org] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [data.entries]);
  const counts = useMemo(() => {
    const c = {};
    for (const e of data.entries) c[e.status] = (c[e.status] || 0) + 1;
    return c;
  }, [data.entries]);

  const results = useMemo(() => {
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const s = SORTS[sort.key];
    const mul = sort.dir === "asc" ? 1 : -1;
    return data.entries
      .filter((e) => {
        if (type !== "all" && e.type !== type) return false;
        if (status !== "all" && e.status !== status) return false;
        if (org !== "all" && e.org !== org) return false;
        if (priority !== "all" && e.priority !== priority) return false;
        if (minScore > 0 && !((e.fitScore ?? -1) >= minScore)) return false;
        if (postingOnly && !hasPostingLead(e)) return false;
        if (terms.length) { const h = hay.get(e) || ""; if (!terms.every((t) => h.includes(t))) return false; }
        return true;
      })
      .sort((a, b) => {
        const va = s.get(a), vb = s.get(b);
        if (va < vb) return -1 * mul;
        if (va > vb) return 1 * mul;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [data.entries, hay, q, type, status, org, priority, minScore, postingOnly, sort]);

  const open = openId ? data.entries.find((e) => (e.id || e.name) === openId) : null;
  const filtersOn = type !== "all" || status !== "all" || org !== "all" || priority !== "all" || minScore > 0 || postingOnly || q;
  const reset = () => { setType("all"); setStatus("all"); setOrg("all"); setPriority("all"); setMinScore(0); setPostingOnly(false); setQ(""); };

  const chip = (active) => ({
    fontFamily: T.mono, fontSize: 12, letterSpacing: "0.03em", padding: "7px 12px", borderRadius: 999,
    cursor: "pointer", whiteSpace: "nowrap", border: `1px solid ${active ? T.accent : T.rule}`,
    background: active ? "rgba(255,107,53,0.14)" : "transparent", color: active ? T.ink : T.dim,
  });
  const selectSmall = { ...inputStyle, width: "auto", padding: "7px 10px", fontSize: 13, fontFamily: T.mono, background: T.surface };

  if (!token) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
        <div style={{ maxWidth: T.maxW, margin: "0 auto", padding: "24px" }}>
          <Login onToken={saveToken} />
        </div>
      </div>
    );
  }

  const labs = data.entries.filter((e) => e.type === "lab");
  const scored = data.entries.filter((e) => e.fitScore != null);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "56px 24px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <Eyebrow n="◦" style={{ marginBottom: 16 }}>Private · Application tracker</Eyebrow>
            <h1 style={{ fontFamily: T.display, fontSize: "clamp(34px, 6vw, 66px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.0, margin: "0 0 8px" }}>Atlas</h1>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={btn("solid")} onClick={() => setEditing({})}>+ Add entry</button>
            <button style={btn("ghost")} onClick={exportJson}>Export</button>
            <button style={btn("ghost")} onClick={logout}>Sign out</button>
          </div>
        </div>

        <p style={{ fontFamily: T.body, fontSize: 16, lineHeight: 1.7, color: T.dim, maxWidth: 680, margin: "12px 0 8px" }}>
          Jobs and research labs I&apos;ve applied to or plan to contact, with my notes on each.
        </p>
        {data.entries.length > 0 && (
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, margin: "0 0 24px" }}>
            {data.entries.length} entries · {labs.length} labs · {orgs.slice(0, 3).map(([o, n]) => `${n} ${o}`).join(" · ")}
            {scored.length > 0 && ` · median fit ${[...scored].sort((a, b) => a.fitScore - b.fitScore)[Math.floor(scored.length / 2)].fitScore}`}
          </p>
        )}

        {/* controls */}
        <div style={{ marginBottom: 12 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search everything: names, PIs, emails, research notes, sources…" style={{ ...inputStyle, background: T.surface, fontSize: 15, padding: "12px 14px" }} />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <button style={chip(org === "all")} onClick={() => setOrg("all")}>All institutions</button>
          {orgs.map(([o, n]) => <button key={o} style={chip(org === o)} onClick={() => setOrg(o)}>{o} ({n})</button>)}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <button style={chip(status === "all")} onClick={() => setStatus("all")}>All statuses</button>
          {STATUS_ORDER.map((s) => (
            <button key={s} style={chip(status === s)} onClick={() => setStatus(s)}>{STATUS[s].label}{counts[s] ? ` (${counts[s]})` : ""}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 8 }}>
          <select style={selectSmall} value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
            <option value="all">All types</option><option value="lab">Labs</option><option value="job">Jobs</option>
          </select>
          <select style={selectSmall} value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
            <option value="all">Any priority</option>{PRIORITY.map((p) => <option key={p} value={p}>{p} priority</option>)}
          </select>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: T.mono, fontSize: 12, color: T.dim }}>
            Min fit {minScore}
            <input type="range" min="0" max="90" step="5" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} style={{ accentColor: T.accent, width: 120 }} />
          </label>
          <button style={chip(postingOnly)} onClick={() => setPostingOnly((v) => !v)} title="Vacancy or hiring notes mention a specific ad or requisition (text match; always verify)">Mentions a posting</button>
          {filtersOn && <button style={{ ...btn("ghost"), padding: "6px 10px", fontSize: 11.5 }} onClick={reset}>Clear filters</button>}
          <span style={{ flex: 1 }} />
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: T.mono, fontSize: 12, color: T.dim }}>
            Sort
            <select style={selectSmall} value={sort.key} onChange={(e) => setSort({ key: e.target.value, dir: SORTS[e.target.value].dir })}>
              {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
            <button style={{ ...btn("ghost"), padding: "6px 10px" }} onClick={() => setSort((s) => ({ ...s, dir: s.dir === "asc" ? "desc" : "asc" }))} title="Flip sort direction">{sort.dir === "asc" ? "↑" : "↓"}</button>
          </label>
          <div style={{ display: "inline-flex", border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
            {["table", "cards"].map((v) => (
              <button key={v} onClick={() => setView(v)} style={{ fontFamily: T.mono, fontSize: 12, padding: "7px 12px", border: "none", cursor: "pointer", background: view === v ? "rgba(255,107,53,0.14)" : "transparent", color: view === v ? T.ink : T.dim }}>{v}</button>
            ))}
          </div>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 12, color: T.dim, marginBottom: 6 }}>{results.length} of {data.entries.length} shown</div>

        <Rule style={{ margin: "12px 0 20px" }} />

        {data.loading ? (
          <p style={{ fontFamily: T.mono, fontSize: 13, color: T.faint }}>Loading…</p>
        ) : data.error ? (
          <div style={{ border: `1px solid ${T.red}`, borderRadius: T.radius, padding: "18px 20px" }}>
            <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Couldn&apos;t reach the tracker</div>
            <p style={{ fontFamily: T.body, fontSize: 14, color: T.dim, margin: "0 0 8px" }}>Make sure the analytics Worker is deployed with the tracker endpoints.</p>
            <Mono>{data.error}</Mono>
          </div>
        ) : data.entries.length === 0 ? (
          <div style={{ border: `1px dashed ${T.ruleStrong}`, borderRadius: T.radius, padding: "28px 22px", textAlign: "center" }}>
            <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No entries yet</div>
            <p style={{ fontFamily: T.body, fontSize: 15, lineHeight: 1.7, color: T.dim, maxWidth: 460, margin: "0 auto 16px" }}>Add a job or lab to get started.</p>
            <button style={btn("solid")} onClick={() => setEditing({})}>+ Add entry</button>
          </div>
        ) : results.length === 0 ? (
          <p style={{ fontFamily: T.mono, fontSize: 13, color: T.faint }}>No entries match those filters.</p>
        ) : view === "table" ? (
          <Table rows={results} sort={sort} setSort={setSort} onOpen={(e) => setOpenId(e.id || e.name)} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {results.map((e) => <EntryCard key={e.id || e.name} e={e} onOpen={() => setOpenId(e.id || e.name)} />)}
          </div>
        )}
      </div>

      {open && !editing && (
        <Detail e={open} onClose={() => setOpenId(null)} onEdit={() => setEditing(open)} onDelete={() => deleteEntry(open)} />
      )}
      {editing && (
        <EntryForm initial={editing.id ? editing : null} onCancel={() => setEditing(null)} onSave={saveEntry} saving={saving} />
      )}
    </div>
  );
}
