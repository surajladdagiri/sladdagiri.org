/** Shared constants and helpers for /t (watch) and /u (upload). No components — see Gate.jsx. */

export const WORKER =
  import.meta.env.VITE_THEATER_WORKER || "https://theater.sladdagiri.workers.dev";

export const C = {
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
};

export const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif';

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function fmt(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

export function bytes(n) {
  if (!isFinite(n) || n <= 0) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

export const inputStyle = {
  width: "100%",
  padding: "11px 13px",
  background: C.glass,
  border: `1px solid ${C.line}`,
  borderRadius: 10,
  color: C.text,
  fontSize: 14,
  fontFamily: FONT,
  outline: "none",
  boxSizing: "border-box",
};

export const btnStyle = (disabled) => ({
  width: "100%",
  marginTop: 14,
  padding: "11px 13px",
  background: disabled ? C.glass : C.blue,
  border: "none",
  borderRadius: 10,
  color: disabled ? C.dim2 : "#fff",
  fontSize: 14,
  fontWeight: 560,
  fontFamily: FONT,
  cursor: disabled ? "default" : "pointer",
  transition: "background 160ms",
});

/** A token banked by a previous unlock in this tab, if any. */
export function readAuth() {
  const t = sessionStorage.getItem("theater.token");
  return t ? { token: t, name: localStorage.getItem("theater.name") || "you" } : null;
}

/** Authenticated JSON call against the Worker. */
export async function api(path, token, body) {
  const r = await fetch(`${WORKER}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `${path} → ${r.status}`);
  return j;
}
