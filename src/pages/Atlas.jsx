import { useCallback, useEffect, useMemo, useState } from "react";
import { T, Eyebrow, Tag, Rule } from "../theme";
import { ANALYTICS_URL } from "../analytics";

/* Atlas — a PRIVATE application tracker for jobs and research labs. Not linked
   anywhere, not in the sitemap, noindex. View / add / edit / delete entries from
   the UI; data is stored in the D1-backed Worker (same one as analytics). Writes
   and reads require the admin login (reused from the dashboard). */

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

const BLANK = {
  type: "job", name: "", org: "", role: "", location: "",
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

/* ---------- read-only detail card ---------- */
function EntryCard({ e, open, onToggle, onEdit, onDelete }) {
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
          <div style={{ fontFamily: T.body, fontSize: 13.5, color: T.dim }}>{[e.role, e.location].filter(Boolean).join(" · ")}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <StatusPill status={e.status} />
          <Stars n={e.fit} />
        </div>
      </div>

      {e.angle && <p style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.6, color: T.dim, margin: "14px 0 0" }}>{e.angle}</p>}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
        {(e.tags || []).map((t) => <Tag key={t}>{t}</Tag>)}
        {e.priority && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint }}>priority: {e.priority}</span>}
        {e.deadline && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint }}>due {e.deadline}</span>}
        {e.appliedDate && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint }}>applied {e.appliedDate}</span>}
      </div>

      {open && (
        <div style={{ marginTop: 8 }}>
          {e.link && <Field label="Link"><a href={e.link} target="_blank" rel="noreferrer" style={linkStyle}>{e.link}</a></Field>}
          {e.projects?.length > 0 && (
            <Field label="Projects to show fit">
              <ul style={{ margin: 0, paddingLeft: 18, fontFamily: T.body, fontSize: 14, lineHeight: 1.7, color: T.dim }}>
                {e.projects.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </Field>
          )}
          {e.contacts?.length > 0 && (
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
          {e.outreach?.length > 0 && (
            <Field label="Outreach">
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
          {e.notes && <Field label="Notes"><p style={{ fontFamily: T.body, fontSize: 14, lineHeight: 1.6, color: T.dim, margin: 0 }}>{e.notes}</p></Field>}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
        <button onClick={onToggle} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.accent, fontFamily: T.mono, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", padding: 0 }}>
          {open ? "Hide details" : "Details"}
        </button>
        <span style={{ flex: 1 }} />
        <button onClick={onEdit} style={btn("ghost")}>Edit</button>
        <button onClick={onDelete} style={btn("danger")}>Delete</button>
      </div>
    </article>
  );
}

/* ---------- add/edit form (modal) ---------- */
function EntryForm({ initial, onCancel, onSave, saving }) {
  const [f, setF] = useState(() => ({ ...BLANK, ...initial, projects: [...(initial?.projects || [])], contacts: (initial?.contacts || []).map((c) => ({ ...c })), outreach: (initial?.outreach || []).map((o) => ({ ...o })), tags: [...(initial?.tags || [])] }));
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setArrObj = (key, i, field, v) => setF((p) => { const arr = p[key].map((it, idx) => (idx === i ? { ...it, [field]: v } : it)); return { ...p, [key]: arr }; });
  const addArrObj = (key, obj) => setF((p) => ({ ...p, [key]: [...p[key], obj] }));
  const delArr = (key, i) => setF((p) => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) }));
  const setProj = (i, v) => setF((p) => ({ ...p, projects: p.projects.map((x, idx) => (idx === i ? v : x)) }));

  const half = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
  const submit = () => { if (!f.name.trim()) return; onSave({ ...f, fit: Number(f.fit) || 0 }); };

  return (
    <div
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(6,6,10,0.7)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 16px", overflowY: "auto" }}
    >
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
            <div><label style={labelStyle}>Organization</label>
              <input style={inputStyle} value={f.org} onChange={(e) => set("org", e.target.value)} placeholder="Parent org / institution" />
            </div>
          </div>
          <div style={half}>
            <div><label style={labelStyle}>Role</label><input style={inputStyle} value={f.role} onChange={(e) => set("role", e.target.value)} /></div>
            <div><label style={labelStyle}>Location</label><input style={inputStyle} value={f.location} onChange={(e) => set("location", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
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
            <div><label style={labelStyle}>Fit (0–3)</label>
              <select style={inputStyle} value={f.fit} onChange={(e) => set("fit", e.target.value)}>
                {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div><label style={labelStyle}>Link</label><input style={inputStyle} value={f.link} onChange={(e) => set("link", e.target.value)} placeholder="https://" /></div>
          <div style={half}>
            <div><label style={labelStyle}>Applied date</label><input type="date" style={inputStyle} value={f.appliedDate} onChange={(e) => set("appliedDate", e.target.value)} /></div>
            <div><label style={labelStyle}>Deadline</label><input type="date" style={inputStyle} value={f.deadline} onChange={(e) => set("deadline", e.target.value)} /></div>
          </div>
          <div><label style={labelStyle}>Angle / pitch</label><textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={f.angle} onChange={(e) => set("angle", e.target.value)} /></div>
          <div><label style={labelStyle}>Tags (comma-separated)</label>
            <input style={inputStyle} value={(f.tags || []).join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
          </div>

          {/* projects */}
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

          {/* contacts */}
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

          {/* outreach */}
          <div>
            <label style={labelStyle}>Outreach</label>
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
  const [openIds, setOpenIds] = useState(() => new Set());
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

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.entries
      .filter((e) => {
        if (type !== "all" && e.type !== type) return false;
        if (status !== "all" && e.status !== status) return false;
        if (s && !JSON.stringify(e).toLowerCase().includes(s)) return false;
        return true;
      })
      .sort((a, b) => {
        const pa = PRIORITY_RANK[a.priority] ?? 1, pb = PRIORITY_RANK[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        const sa = STATUS_ORDER.indexOf(a.status), sb = STATUS_ORDER.indexOf(b.status);
        if (sa !== sb) return sa - sb;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [data.entries, q, type, status]);

  const counts = useMemo(() => {
    const c = {};
    for (const e of data.entries) c[e.status] = (c[e.status] || 0) + 1;
    return c;
  }, [data.entries]);

  const toggle = (id) => setOpenIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const chip = (active) => ({
    fontFamily: T.mono, fontSize: 12, letterSpacing: "0.03em", padding: "7px 12px", borderRadius: 999,
    cursor: "pointer", whiteSpace: "nowrap", border: `1px solid ${active ? T.accent : T.rule}`,
    background: active ? "rgba(255,107,53,0.14)" : "transparent", color: active ? T.ink : T.dim,
  });

  if (!token) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
        <div style={{ maxWidth: T.maxW, margin: "0 auto", padding: "24px" }}>
          <Login onToken={saveToken} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
      <div style={{ maxWidth: T.maxW, margin: "0 auto", padding: "56px 24px 100px" }}>
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

        <p style={{ fontFamily: T.body, fontSize: 16, lineHeight: 1.7, color: T.dim, maxWidth: 640, margin: "12px 0 28px" }}>
          Jobs and research labs I&apos;ve applied to, plan to apply to, or want to reach out to — with contacts, outreach, drafts, and my angle for each.
        </p>

        {/* controls */}
        <div style={{ marginBottom: 12 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names, contacts, notes…" style={{ ...inputStyle, background: T.surface, fontSize: 15, padding: "12px 14px" }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <button style={chip(type === "all")} onClick={() => setType("all")}>All types</button>
          <button style={chip(type === "job")} onClick={() => setType("job")}>Jobs</button>
          <button style={chip(type === "lab")} onClick={() => setType("lab")}>Labs</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <button style={chip(status === "all")} onClick={() => setStatus("all")}>All statuses</button>
          {STATUS_ORDER.map((s) => (
            <button key={s} style={chip(status === s)} onClick={() => setStatus(s)}>{STATUS[s].label}{counts[s] ? ` (${counts[s]})` : ""}</button>
          ))}
          <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 12, color: T.dim }}>{results.length} {results.length === 1 ? "entry" : "entries"}</span>
        </div>

        <Rule style={{ margin: "18px 0 24px" }} />

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
            <p style={{ fontFamily: T.body, fontSize: 15, lineHeight: 1.7, color: T.dim, maxWidth: 460, margin: "0 auto 16px" }}>Add your first job or lab to start tracking applications, contacts, and outreach.</p>
            <button style={btn("solid")} onClick={() => setEditing({})}>+ Add entry</button>
          </div>
        ) : results.length === 0 ? (
          <p style={{ fontFamily: T.mono, fontSize: 13, color: T.faint }}>No entries match those filters.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {results.map((e) => (
              <EntryCard
                key={e.id || e.name}
                e={e}
                open={openIds.has(e.id || e.name)}
                onToggle={() => toggle(e.id || e.name)}
                onEdit={() => setEditing(e)}
                onDelete={() => deleteEntry(e)}
              />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EntryForm initial={editing.id ? editing : null} onCancel={() => setEditing(null)} onSave={saveEntry} saving={saving} />
      )}
    </div>
  );
}
