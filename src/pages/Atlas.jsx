import { useEffect, useMemo, useState } from "react";
import { T, Eyebrow, Tag, Rule } from "../theme";

/* Atlas — a PRIVATE application tracker for jobs and research labs. Not linked
   anywhere, not in the sitemap, noindex: reachable only if you know the URL.

   All data lives in /public/tracker.json (see TRACKER.md for the schema). The
   page fetches it at runtime, so it can be updated — by hand or by an AI agent —
   without touching any code. This file only renders whatever is in that JSON. */

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
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

const TEMPLATE = `{
  "id": "unique-slug",
  "type": "job",
  "name": "Company or lab name",
  "org": "Parent org / institution",
  "role": "Role or position",
  "location": "City, State",
  "status": "to_apply",
  "priority": "medium",
  "fit": 2,
  "link": "https://...",
  "appliedDate": "",
  "deadline": "",
  "angle": "Why you fit / your pitch.",
  "projects": ["A demo that proves the fit"],
  "contacts": [
    { "name": "", "role": "", "email": "", "linkedin": "", "note": "" }
  ],
  "outreach": [
    { "channel": "email", "date": "", "status": "draft", "message": "" }
  ],
  "draftEmail": "An email you can send.",
  "tags": [],
  "notes": ""
}`;

function StatusPill({ status }) {
  const s = STATUS[status] || { label: status || "—", color: T.dim };
  return (
    <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: s.color, border: `1px solid ${s.color}`, borderRadius: 3, padding: "3px 8px", whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

function Stars({ n }) {
  if (!n) return null;
  return (
    <span style={{ fontFamily: T.mono, fontSize: 13, letterSpacing: 1 }} title={`Fit ${n}/3`}>
      <span style={{ color: T.accent }}>{"●".repeat(n)}</span>
      <span style={{ color: T.rule }}>{"●".repeat(Math.max(0, 3 - n))}</span>
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginTop: 14 }}>
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

function EntryCard({ e, open, onToggle }) {
  const linkStyle = { color: T.accent2, textDecoration: "none", fontFamily: T.mono, fontSize: 13 };
  return (
    <article style={{ background: T.surface, border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "18px 20px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: e.type === "lab" ? T.accent2 : T.accent, border: `1px solid ${T.rule}`, borderRadius: 3, padding: "2px 7px" }}>
              {e.type === "lab" ? "Lab" : "Job"}
            </span>
            {e.org && <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: T.dim }}>{e.org}</span>}
          </div>
          <h3 style={{ fontFamily: T.display, fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 2px", lineHeight: 1.2 }}>{e.name}</h3>
          <div style={{ fontFamily: T.body, fontSize: 13.5, color: T.dim }}>
            {[e.role, e.location].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <StatusPill status={e.status} />
          <Stars n={e.fit} />
        </div>
      </div>

      {e.angle && (
        <p style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.6, color: T.dim, margin: "14px 0 0" }}>{e.angle}</p>
      )}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
        {(e.tags || []).map((t) => <Tag key={t}>{t}</Tag>)}
        {e.priority && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint }}>priority: {e.priority}</span>}
        {e.deadline && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint }}>due {e.deadline}</span>}
        {e.appliedDate && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint }}>applied {e.appliedDate}</span>}
      </div>

      {open && (
        <div style={{ marginTop: 8 }}>
          {e.link && (
            <Field label="Link">
              <a href={e.link} target="_blank" rel="noreferrer" style={linkStyle}>{e.link}</a>
            </Field>
          )}

          {e.projects && e.projects.length > 0 && (
            <Field label="Projects to show fit">
              <ul style={{ margin: 0, paddingLeft: 18, fontFamily: T.body, fontSize: 14, lineHeight: 1.7, color: T.dim }}>
                {e.projects.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </Field>
          )}

          {e.contacts && e.contacts.length > 0 && (
            <Field label="Contacts">
              <div style={{ display: "grid", gap: 10 }}>
                {e.contacts.map((c, i) => (
                  <div key={i} style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "10px 12px" }}>
                    <div style={{ fontFamily: T.display, fontSize: 14.5, fontWeight: 500 }}>{[c.name, c.role].filter(Boolean).join(" · ") || "—"}</div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 4 }}>
                      {c.email && <a href={`mailto:${c.email}`} style={linkStyle}>{c.email}</a>}
                      {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" style={linkStyle}>LinkedIn</a>}
                    </div>
                    {c.note && <div style={{ fontFamily: T.body, fontSize: 13.5, color: T.dim, marginTop: 6 }}>{c.note}</div>}
                  </div>
                ))}
              </div>
            </Field>
          )}

          {e.outreach && e.outreach.length > 0 && (
            <Field label="Outreach">
              <div style={{ display: "grid", gap: 10 }}>
                {e.outreach.map((o, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.faint, marginBottom: 4 }}>
                      {[o.channel, o.status, o.date].filter(Boolean).join(" · ")}
                    </div>
                    {o.message && <Mono>{o.message}</Mono>}
                  </div>
                ))}
              </div>
            </Field>
          )}

          {e.draftEmail && (
            <Field label="Email I can send">
              <Mono>{e.draftEmail}</Mono>
            </Field>
          )}

          {e.notes && (
            <Field label="Notes">
              <p style={{ fontFamily: T.body, fontSize: 14, lineHeight: 1.6, color: T.dim, margin: 0 }}>{e.notes}</p>
            </Field>
          )}
        </div>
      )}

      <button
        onClick={onToggle}
        style={{ marginTop: 14, background: "transparent", border: "none", cursor: "pointer", color: T.accent, fontFamily: T.mono, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", padding: 0 }}
      >
        {open ? "Hide details" : "Details"}
      </button>
    </article>
  );
}

function AddHelp() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(TEMPLATE); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };
  return (
    <details style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "0 16px", marginBottom: 22 }}>
      <summary style={{ cursor: "pointer", padding: "14px 0", fontFamily: T.mono, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase", color: T.ink, listStyle: "none" }}>
        + Add or edit an entry
      </summary>
      <div style={{ paddingBottom: 16 }}>
        <p style={{ fontFamily: T.body, fontSize: 14, lineHeight: 1.7, color: T.dim, margin: "0 0 12px" }}>
          All data lives in <code style={{ fontFamily: T.mono, color: T.accent2 }}>public/tracker.json</code> as
          {" "}<code style={{ fontFamily: T.mono, color: T.accent2 }}>{`{ "entries": [ ... ] }`}</code>. Append an
          object like the one below to the <code style={{ fontFamily: T.mono, color: T.accent2 }}>entries</code> array,
          keep it valid JSON, and it appears here on the next load. Full schema is in
          {" "}<code style={{ fontFamily: T.mono, color: T.accent2 }}>TRACKER.md</code>.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button onClick={copy} style={{ background: "transparent", border: `1px solid ${T.rule}`, borderRadius: T.radius, color: T.ink, fontFamily: T.mono, fontSize: 12, padding: "6px 12px", cursor: "pointer" }}>
            {copied ? "Copied" : "Copy template"}
          </button>
        </div>
        <Mono>{TEMPLATE}</Mono>
      </div>
    </details>
  );
}

export default function Atlas() {
  const [data, setData] = useState({ loading: true, error: null, entries: [] });
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [openIds, setOpenIds] = useState(() => new Set());

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL || "/"}tracker.json`;
    fetch(url, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => setData({ loading: false, error: null, entries: Array.isArray(d.entries) ? d.entries : [] }))
      .catch((e) => setData({ loading: false, error: String(e), entries: [] }));
  }, []);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.entries
      .filter((e) => {
        if (type !== "all" && e.type !== type) return false;
        if (status !== "all" && e.status !== status) return false;
        if (s) {
          const hay = JSON.stringify(e).toLowerCase();
          if (!hay.includes(s)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const pa = PRIORITY_RANK[a.priority] ?? 1;
        const pb = PRIORITY_RANK[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        const sa = STATUS_ORDER.indexOf(a.status);
        const sb = STATUS_ORDER.indexOf(b.status);
        if (sa !== sb) return sa - sb;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [data.entries, q, type, status]);

  const counts = useMemo(() => {
    const c = {};
    for (const e of data.entries) c[e.status] = (c[e.status] || 0) + 1;
    return c;
  }, [data.entries]);

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const input = {
    width: "100%", background: T.surface, border: `1px solid ${T.rule}`, borderRadius: T.radius,
    color: T.ink, fontFamily: T.body, fontSize: 15, padding: "12px 14px", outline: "none",
  };
  const chip = (active) => ({
    fontFamily: T.mono, fontSize: 12, letterSpacing: "0.03em", padding: "7px 12px", borderRadius: 999,
    cursor: "pointer", whiteSpace: "nowrap", border: `1px solid ${active ? T.accent : T.rule}`,
    background: active ? "rgba(255,107,53,0.14)" : "transparent", color: active ? T.ink : T.dim,
  });

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
      <div style={{ maxWidth: T.maxW, margin: "0 auto", padding: "56px 24px 100px" }}>
        <Eyebrow n="◦" style={{ marginBottom: 16 }}>Private · Application tracker</Eyebrow>
        <h1 style={{ fontFamily: T.display, fontSize: "clamp(34px, 6vw, 66px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.0, margin: "0 0 16px" }}>
          Atlas
        </h1>
        <p style={{ fontFamily: T.body, fontSize: 16.5, lineHeight: 1.7, color: T.dim, maxWidth: 640, margin: "0 0 10px" }}>
          Jobs and research labs I&apos;ve applied to, plan to apply to, or want to
          reach out to — with contacts, outreach, drafts, and my angle for each.
        </p>
        <p style={{ fontFamily: T.mono, fontSize: 11.5, color: T.faint, margin: "0 0 28px" }}>
          Data: public/tracker.json · Schema: TRACKER.md
        </p>

        <AddHelp />

        {/* controls */}
        <div style={{ marginBottom: 12 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names, contacts, notes…" style={input} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <button style={chip(type === "all")} onClick={() => setType("all")}>All types</button>
          <button style={chip(type === "job")} onClick={() => setType("job")}>Jobs</button>
          <button style={chip(type === "lab")} onClick={() => setType("lab")}>Labs</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <button style={chip(status === "all")} onClick={() => setStatus("all")}>All statuses</button>
          {STATUS_ORDER.map((s) => (
            <button key={s} style={chip(status === s)} onClick={() => setStatus(s)}>
              {STATUS[s].label}{counts[s] ? ` (${counts[s]})` : ""}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 12, color: T.dim }}>
            {results.length} {results.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        <Rule style={{ margin: "18px 0 24px" }} />

        {/* body */}
        {data.loading ? (
          <p style={{ fontFamily: T.mono, fontSize: 13, color: T.faint }}>Loading…</p>
        ) : data.error ? (
          <div style={{ border: `1px solid ${T.red}`, borderRadius: T.radius, padding: "18px 20px" }}>
            <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Couldn&apos;t load tracker.json</div>
            <p style={{ fontFamily: T.body, fontSize: 14, color: T.dim, margin: "0 0 8px" }}>
              The data file is missing or not valid JSON. Fix <code style={{ fontFamily: T.mono, color: T.accent2 }}>public/tracker.json</code> (see TRACKER.md).
            </p>
            <Mono>{data.error}</Mono>
          </div>
        ) : data.entries.length === 0 ? (
          <div style={{ border: `1px dashed ${T.ruleStrong}`, borderRadius: T.radius, padding: "28px 22px", textAlign: "center" }}>
            <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No entries yet</div>
            <p style={{ fontFamily: T.body, fontSize: 15, lineHeight: 1.7, color: T.dim, maxWidth: 520, margin: "0 auto" }}>
              This tracker is empty. Add entries to <code style={{ fontFamily: T.mono, color: T.accent2 }}>public/tracker.json</code> using
              the template in “Add or edit an entry” above. The full schema is in <code style={{ fontFamily: T.mono, color: T.accent2 }}>TRACKER.md</code>.
            </p>
          </div>
        ) : results.length === 0 ? (
          <p style={{ fontFamily: T.mono, fontSize: 13, color: T.faint }}>No entries match those filters.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {results.map((e) => (
              <EntryCard key={e.id || e.name} e={e} open={openIds.has(e.id || e.name)} onToggle={() => toggle(e.id || e.name)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
