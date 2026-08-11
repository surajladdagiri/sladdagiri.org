import { T, Eyebrow } from "../theme";

export default function Demos() {
  return (
    <div
      style={{
        minHeight: "88vh",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: T.radius,
          border: `1px solid ${T.rule}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
      <h1
        style={{
          fontFamily: T.display,
          fontSize: 34,
          fontWeight: 600,
          color: T.ink,
          margin: 0,
          letterSpacing: "-0.03em",
        }}
      >
        Demos
      </h1>
      <Eyebrow>Coming soon. Work in progress.</Eyebrow>
    </div>
  );
}
