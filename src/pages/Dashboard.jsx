import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { T, Eyebrow, Rule } from "../theme";
import { ANALYTICS_URL } from "../analytics";

const TOKEN_KEY = "dashboard.token.v1";

const NET_COLOR = {
  residential: T.green,
  datacenter: T.accent,
  mobile: "#5b93d6",
  education: "#5b93d6",
  corporate: "#c58be0",
  unknown: T.dim,
};

// Shared column layout for the recent-visits table header and rows, so they
// always line up. Fixed columns for the short fields, flexible for the rest.
const ROW = {
  display: "grid",
  gridTemplateColumns: "132px 150px minmax(140px,1fr) 112px minmax(150px,1fr) 130px",
  columnGap: 14,
  padding: "11px 16px",
};

function fmtTime(ms) {
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Badge({ type }) {
  const c = NET_COLOR[type] || T.dim;
  return (
    <span
      style={{
        fontFamily: T.mono,
        fontSize: 11,
        letterSpacing: "0.03em",
        color: c,
        border: `1px solid ${T.rule}`,
        borderRadius: 3,
        padding: "2px 7px",
        whiteSpace: "nowrap",
      }}
    >
      {type}
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ padding: "18px 20px", borderLeft: `1px solid ${T.rule}` }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: T.display, fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}

function Chips({ title, rows, keyName }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Eyebrow style={{ display: "block", marginBottom: 10 }}>{title}</Eyebrow>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {rows.length === 0 && (
          <span style={{ fontFamily: T.body, fontSize: 13, color: T.faint }}>No data yet.</span>
        )}
        {rows.map((r) => (
          <span
            key={r[keyName]}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "7px 12px", fontFamily: T.body, fontSize: 13, color: T.ink }}
          >
            {r[keyName]}
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.dim }}>{r.n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function BarList({ title, rows, label }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div>
      <Eyebrow style={{ display: "block", marginBottom: 14 }}>{title}</Eyebrow>
      {rows.length === 0 && (
        <div style={{ fontFamily: T.body, fontSize: 14, color: T.faint }}>No data yet.</div>
      )}
      {rows.map((r, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 4 }}>
            <span style={{ fontFamily: T.body, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
              {label(r)}
            </span>
            <span style={{ fontFamily: T.mono, color: T.dim }}>{r.n}</span>
          </div>
          <div style={{ height: 3, background: T.rule, borderRadius: 2 }}>
            <div style={{ height: 3, width: `${(r.n / max) * 100}%`, background: T.accent, borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function IpModal({ visitor, token, onClose, onSaved }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nick, setNick] = useState(visitor.nickname || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`${ANALYTICS_URL}/ip?ip=${encodeURIComponent(visitor.ip)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dd = await r.json();
        if (alive) {
          setDetail(dd);
          setNick(dd.nickname || visitor.nickname || "");
        }
      } catch {
        if (alive) setDetail({ visits: [], devices: [] });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [visitor.ip, token]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${ANALYTICS_URL}/label`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ip: visitor.ip, nickname: nick }),
      });
      onSaved(visitor.ip, nick.trim());
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const title = (nick || visitor.nickname || visitor.ip || "Unknown").trim();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(6,6,7,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(680px, 100%)",
          maxHeight: "86vh",
          background: T.bg2,
          border: `1px solid ${T.rule}`,
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "18px 20px", borderBottom: `1px solid ${T.rule}` }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: T.dim, marginTop: 4 }}>
              {visitor.ip}
              {visitor.visits ? ` · ${visitor.visits} visit${visitor.visits === 1 ? "" : "s"}` : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ flexShrink: 0, width: 34, height: 34, borderRadius: T.radius, border: `1px solid ${T.rule}`, background: "transparent", color: T.ink, fontSize: 18, cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        {/* body */}
        <div style={{ padding: "18px 20px", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            <Badge type={visitor.net_type} />
            <span style={{ fontFamily: T.body, fontSize: 13.5, color: T.dim }}>
              {[visitor.city, visitor.region, visitor.country].filter(Boolean).join(", ") || "Unknown location"}
            </span>
            {visitor.org && <span style={{ fontFamily: T.body, fontSize: 13.5, color: T.dim }}>· {visitor.org}</span>}
          </div>

          {/* nickname editor */}
          <Eyebrow style={{ display: "block", marginBottom: 8 }}>Nickname</Eyebrow>
          <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="e.g. Recruiter at X, my phone…"
              onKeyDown={(e) => e.key === "Enter" && save()}
              style={{ flex: 1, background: T.surface, border: `1px solid ${T.rule}`, borderRadius: T.radius, color: T.ink, fontFamily: T.body, fontSize: 14, padding: "9px 12px", outline: "none" }}
            />
            <button
              onClick={save}
              disabled={saving}
              style={{ background: T.accent, color: T.accentInk, border: "none", borderRadius: T.radius, fontFamily: T.body, fontSize: 14, fontWeight: 600, padding: "9px 16px", cursor: "pointer" }}
            >
              {saving ? "…" : "Save"}
            </button>
          </div>

          {/* devices */}
          <Eyebrow style={{ display: "block", marginBottom: 10 }}>Devices seen</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
            {(detail?.devices || []).length === 0 && (
              <span style={{ fontFamily: T.body, fontSize: 13, color: T.faint }}>{loading ? "Loading…" : "None."}</span>
            )}
            {(detail?.devices || []).map((dv, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "7px 11px", fontFamily: T.body, fontSize: 13, color: T.ink }}>
                {dv.device === "bot" ? "Bot" : [dv.os, dv.browser].filter(Boolean).join(" · ") || dv.device || "Unknown"}
                <span style={{ fontFamily: T.mono, fontSize: 11.5, color: T.dim }}>{dv.n}</span>
              </span>
            ))}
          </div>

          {/* visit log */}
          <Eyebrow style={{ display: "block", marginBottom: 10 }}>
            Visit log{detail?.visits ? ` (${detail.visits.length})` : ""}
          </Eyebrow>
          <div style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
            {loading && (
              <div style={{ padding: "12px 14px", fontFamily: T.mono, fontSize: 12, color: T.dim }}>Loading…</div>
            )}
            {!loading && (detail?.visits || []).length === 0 && (
              <div style={{ padding: "12px 14px", fontFamily: T.mono, fontSize: 12, color: T.faint }}>No visits.</div>
            )}
            {(detail?.visits || []).map((v, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "150px 1fr 130px", columnGap: 12, padding: "10px 14px", borderTop: i === 0 ? "none" : `1px solid ${T.rule}`, alignItems: "center" }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.dim, whiteSpace: "nowrap" }}>{fmtTime(v.ts)}</div>
                <div style={{ fontFamily: T.body, fontSize: 13, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={v.path || ""}>{v.path || "—"}</div>
                <div style={{ fontFamily: T.body, fontSize: 12.5, color: T.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v.device === "bot" ? "Bot" : [v.os, v.browser].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Login({ onToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("idle"); // idle | checking | bad
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setState("checking");
    try {
      const r = await fetch(`${ANALYTICS_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!r.ok) throw new Error("bad");
      const { token } = await r.json();
      sessionStorage.setItem(TOKEN_KEY, token);
      onToken(token);
    } catch {
      setState("bad");
      setPassword("");
      setTimeout(() => setState("idle"), 1600);
    }
  };

  const field = {
    width: "100%",
    background: T.surface,
    border: `1px solid ${state === "bad" ? T.red : T.rule}`,
    borderRadius: T.radius,
    color: T.ink,
    fontFamily: T.body,
    fontSize: 15,
    padding: "12px 14px",
    marginBottom: 12,
    outline: "none",
  };

  return (
    <div style={{ minHeight: "82vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" }}>
      <form onSubmit={submit} style={{ width: "min(360px, 100%)" }}>
        <Eyebrow n="◦" style={{ marginBottom: 18 }}>Private</Eyebrow>
        <h1 style={{ fontFamily: T.display, fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 26px" }}>
          Dashboard
        </h1>
        <input
          ref={ref}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="username"
          style={field}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          style={field}
        />
        <button
          type="submit"
          disabled={state === "checking"}
          style={{
            width: "100%",
            background: T.accent,
            color: T.accentInk,
            border: "none",
            borderRadius: T.radius,
            fontFamily: T.body,
            fontSize: 15,
            fontWeight: 600,
            padding: "12px 14px",
            cursor: "pointer",
          }}
        >
          {state === "checking" ? "Checking…" : "Sign in"}
        </button>
        {state === "bad" && (
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.red, marginTop: 12 }}>
            Wrong email or password.
          </div>
        )}
      </form>
    </div>
  );
}

export default function Dashboard() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openVisitor, setOpenVisitor] = useState(null);
  const [labelOverrides, setLabelOverrides] = useState({});

  const nickFor = (v) =>
    (v.ip in labelOverrides ? labelOverrides[v.ip] : v.nickname) || "";

  const load = async (tok) => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`${ANALYTICS_URL}/stats`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (r.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        return;
      }
      if (!r.ok) throw new Error(`stats failed (${r.status})`);
      setData(await r.json());
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load(token);
  }, [token]);

  if (!token) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
        <Login onToken={setToken} />
      </div>
    );
  }

  const d = data;
  const byDay = d ? [...d.byDay].reverse() : [];
  const dayMax = Math.max(1, ...byDay.map((x) => x.n));

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "44px 24px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
          <div>
            <Eyebrow n="◦">Private</Eyebrow>
            <h1 style={{ fontFamily: T.display, fontSize: "clamp(28px,4vw,40px)", fontWeight: 600, letterSpacing: "-0.03em", margin: "10px 0 0" }}>
              Visitor analytics
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => load(token)}
              style={{ background: "transparent", border: `1px solid ${T.rule}`, borderRadius: T.radius, color: T.ink, fontFamily: T.mono, fontSize: 12, padding: "8px 12px", cursor: "pointer" }}
            >
              {loading ? "…" : "Refresh"}
            </button>
            <button
              onClick={() => { sessionStorage.removeItem(TOKEN_KEY); setToken(null); }}
              style={{ background: "transparent", border: `1px solid ${T.rule}`, borderRadius: T.radius, color: T.dim, fontFamily: T.mono, fontSize: 12, padding: "8px 12px", cursor: "pointer" }}
            >
              Sign out
            </button>
          </div>
        </div>

        {err && (
          <div style={{ fontFamily: T.mono, fontSize: 13, color: T.red, marginBottom: 20 }}>
            {err}. Is the Worker deployed and VITE_ANALYTICS_URL set?
          </div>
        )}

        {!d && !err && (
          <div style={{ fontFamily: T.mono, fontSize: 13, color: T.dim }}>Loading…</div>
        )}

        {d && (
          <>
            {/* summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden", marginBottom: 34 }}>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, marginBottom: 10 }}>Total views</div>
                <div style={{ fontFamily: T.display, fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>{d.total}</div>
              </div>
              <Stat label="Unique IPs" value={d.uniqueIps} />
              <Stat label="Today" value={d.today} />
            </div>

            {/* by day */}
            <Eyebrow style={{ display: "block", marginBottom: 14 }}>Views, last 14 days</Eyebrow>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90, marginBottom: 34 }}>
              {byDay.map((x) => (
                <div key={x.day} title={`${x.day}: ${x.n}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: "100%", height: `${(x.n / dayMax) * 70}px`, minHeight: 2, background: T.accent, borderRadius: 2 }} />
                  <div style={{ fontFamily: T.mono, fontSize: 9, color: T.faint }}>{x.day.slice(5)}</div>
                </div>
              ))}
            </div>

            {/* network type breakdown */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 34 }}>
              {d.netTypes.map((r) => (
                <div key={r.net_type} style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "8px 12px" }}>
                  <Badge type={r.net_type} />
                  <span style={{ fontFamily: T.mono, fontSize: 13, color: T.ink }}>{r.n}</span>
                </div>
              ))}
            </div>

            {/* device / os / browser */}
            <Chips title="Devices" rows={d.devices || []} keyName="device" />
            <Chips title="Operating systems" rows={d.oses || []} keyName="os" />
            <Chips title="Browsers" rows={d.browsers || []} keyName="browser" />

            {/* bar lists */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 30, marginTop: 14, marginBottom: 40 }}>
              <BarList title="Top pages" rows={d.topPaths} label={(r) => r.path} />
              <BarList title="Top locations" rows={d.topCities} label={(r) => [r.city, r.region, r.country].filter(Boolean).join(", ")} />
              <BarList title="Top ISPs / networks" rows={d.topNetworks || []} label={(r) => r.org} />
              <BarList title="Non-residential only" rows={d.topOrgs} label={(r) => r.org} />
            </div>

            {/* visitors (one row per unique IP, most recent first) */}
            <Eyebrow style={{ display: "block", marginBottom: 14 }}>
              Visitors ({(d.visitors || []).length}) · click a row for details
            </Eyebrow>
            <div style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 920 }}>
                  <div style={{ ...ROW, fontFamily: T.mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: T.dim, borderBottom: `1px solid ${T.rule}` }}>
                    <div>Last seen</div><div>Visitor</div><div>Location</div><div>Network</div><div>ISP / org</div><div>Device</div>
                  </div>
                  <div style={{ maxHeight: 520, overflowY: "auto" }}>
                    {(d.visitors || []).map((v, i) => {
                      const nick = nickFor(v);
                      return (
                        <div
                          key={v.ip || i}
                          onClick={() => setOpenVisitor(v)}
                          style={{ ...ROW, fontSize: 12.5, borderTop: i === 0 ? "none" : `1px solid ${T.rule}`, alignItems: "center", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = T.surface)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div style={{ fontFamily: T.mono, color: T.dim, whiteSpace: "nowrap" }}>{fmtTime(v.last_ts)}</div>
                          <div style={{ overflow: "hidden" }}>
                            <div style={{ fontFamily: nick ? T.body : T.mono, color: T.ink, fontWeight: nick ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={v.ip || ""}>
                              {nick || v.ip || "—"}
                            </div>
                            <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {(nick ? v.ip + " · " : "") + v.visits + (v.visits === 1 ? " visit" : " visits")}
                            </div>
                          </div>
                          <div style={{ fontFamily: T.body, color: T.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {[v.city, v.region, v.country].filter(Boolean).join(", ") || "—"}
                          </div>
                          <div><Badge type={v.net_type} /></div>
                          <div style={{ fontFamily: T.body, color: T.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {v.org || "—"}
                          </div>
                          <div style={{ fontFamily: T.body, color: T.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {v.device === "bot" ? "Bot" : [v.os, v.browser].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {openVisitor && (
          <IpModal
            visitor={{ ...openVisitor, nickname: nickFor(openVisitor) }}
            token={token}
            onClose={() => setOpenVisitor(null)}
            onSaved={(ip, nickname) => setLabelOverrides((prev) => ({ ...prev, [ip]: nickname }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
