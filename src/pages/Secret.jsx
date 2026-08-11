import { useEffect, useRef, useState } from "react";
import { T, Eyebrow, Rule } from "../theme";
import { ANALYTICS_URL } from "../analytics";

const TOKEN_KEY = "secret.token.v1";

const NET_COLOR = {
  residential: T.green,
  datacenter: T.accent,
  mobile: "#5b93d6",
  education: "#5b93d6",
  corporate: "#c58be0",
  unknown: T.dim,
};

function fmtTime(ms) {
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
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

export default function Secret() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

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

            {/* three bar lists */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 30, marginBottom: 40 }}>
              <BarList title="Top pages" rows={d.topPaths} label={(r) => r.path} />
              <BarList title="Top locations" rows={d.topCities} label={(r) => [r.city, r.region, r.country].filter(Boolean).join(", ")} />
              <BarList title="Non-residential networks" rows={d.topOrgs} label={(r) => r.org} />
            </div>

            {/* recent visits */}
            <Eyebrow style={{ display: "block", marginBottom: 14 }}>Recent visits</Eyebrow>
            <div style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 130px 1fr 110px 1fr", gap: 0, fontFamily: T.mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: T.dim, padding: "10px 14px", borderBottom: `1px solid ${T.rule}` }}>
                <div>When</div><div>IP</div><div>Location</div><div>Network</div><div>Org / path</div>
              </div>
              <div style={{ maxHeight: 460, overflowY: "auto" }}>
                {d.recent.map((v, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 130px 1fr 110px 1fr", gap: 0, fontSize: 12.5, padding: "10px 14px", borderTop: i === 0 ? "none" : `1px solid ${T.rule}`, alignItems: "center" }}>
                    <div style={{ fontFamily: T.mono, color: T.dim }}>{fmtTime(v.ts)}</div>
                    <div style={{ fontFamily: T.mono, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.ip || "—"}</div>
                    <div style={{ fontFamily: T.body, color: T.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {[v.city, v.region, v.country].filter(Boolean).join(", ") || "—"}
                    </div>
                    <div><Badge type={v.net_type} /></div>
                    <div style={{ fontFamily: T.body, color: T.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {v.net_type !== "residential" && v.org ? v.org : v.path || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
