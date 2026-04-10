export default function Demos() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#121212",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "0.5rem",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "#f5f5f7",
          margin: 0,
          letterSpacing: "-0.5px",
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        }}
      >
        Demos
      </h1>
      <p
        style={{
          fontSize: 15,
          color: "rgba(245,245,247,0.45)",
          margin: 0,
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        }}
      >
        Coming soon — work in progress.
      </p>
    </div>
  );
}