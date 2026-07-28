import { useState } from "react";
import { WORKER, C, FONT, inputStyle, btnStyle } from "./theater.js";

/** The passphrase wall. Shared by the watch page and the upload page. */
export default function Gate({ onUnlock, label = "⌘ THEATER", askName = true }) {
  const [pass, setPass] = useState("");
  const [name, setName] = useState(() => localStorage.getItem("theater.name") || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!pass || busy) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(`${WORKER}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pass }),
      });
      if (!r.ok) {
        setErr(r.status === 401 ? "Not that." : `Server said ${r.status}.`);
        setPass("");
        return;
      }
      const { token } = await r.json();
      localStorage.setItem("theater.name", name || "you");
      sessionStorage.setItem("theater.token", token);
      onUnlock(token, name || "you");
    } catch {
      setErr("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: FONT,
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 320 }}>
        <div style={{ fontSize: 13, letterSpacing: 0.4, color: C.dim2, marginBottom: 28 }}>
          {label}
        </div>

        {askName && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            autoComplete="off"
            style={inputStyle}
          />
        )}
        <input
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          type="password"
          placeholder="passphrase"
          autoFocus
          autoComplete="off"
          style={{ ...inputStyle, marginTop: askName ? 10 : 0 }}
        />

        <button type="submit" disabled={busy || !pass} style={btnStyle(busy || !pass)}>
          {busy ? "checking…" : "enter"}
        </button>

        <div style={{ height: 18, marginTop: 12, fontSize: 12.5, color: C.red }}>{err}</div>
      </form>
    </div>
  );
}
