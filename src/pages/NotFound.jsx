import { useNavigate } from "react-router-dom";
import { T, Eyebrow, Btn } from "../theme";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: "82vh",
        background: T.bg,
        color: T.ink,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        textAlign: "center",
      }}
    >
      <Eyebrow n="404" style={{ marginBottom: 20 }}>
        Page not found
      </Eyebrow>
      <h1
        style={{
          fontFamily: T.display,
          fontSize: "clamp(36px, 7vw, 72px)",
          fontWeight: 600,
          letterSpacing: "-0.04em",
          margin: "0 0 16px",
        }}
      >
        This page doesn&apos;t exist
      </h1>
      <p style={{ fontFamily: T.body, fontSize: 16, color: T.dim, maxWidth: 440, margin: "0 0 28px" }}>
        The link may be broken, or the page may have moved. Here are a couple of
        places that do exist.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Btn onClick={() => navigate("/")} variant="solid">
          Home
        </Btn>
        <Btn onClick={() => navigate("/portfolio")}>Work</Btn>
      </div>
    </div>
  );
}
