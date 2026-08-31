import { useNavigate } from "react-router-dom";
import { T, Eyebrow, Btn } from "../theme";

export default function Demos() {
  const navigate = useNavigate();
  return (
    <div style={{ background: T.bg, minHeight: "80vh", color: T.ink }}>
      <div style={{ maxWidth: T.maxW, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <Eyebrow n="◦">Try it</Eyebrow>
          <div style={{ flex: 1, height: 1, background: T.rule }} />
        </div>
        <h1 style={{ fontFamily: T.display, fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
          Demos
        </h1>
        <p style={{ fontFamily: T.body, fontSize: 16, lineHeight: 1.7, color: T.dim, maxWidth: 620, margin: "0 0 30px" }}>
          Two of my projects are apps you can install and use right now. The
          rest of my work is on the Work page.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn href="https://apps.apple.com/us/app/music-strip/id6761938199" target="_blank" variant="solid">
            Music Strip on the App Store
          </Btn>
          <Btn href="https://apps.apple.com/us/app/haven-app/id6761937548" target="_blank">
            HAVEN on the App Store
          </Btn>
          <Btn onClick={() => navigate("/portfolio")}>See all work</Btn>
        </div>
      </div>
    </div>
  );
}
