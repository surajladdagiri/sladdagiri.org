import { Link } from "react-router-dom";
import { T, Eyebrow, Card, Rule } from "../theme";
import Reveal from "../Reveal";

const SECTIONS = [
  {
    title: "Commitment",
    body:
      "I want this site to be usable by as many people as possible, including people who rely on assistive technology. I aim to follow the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA as a practical target.",
  },
  {
    title: "What's in place",
    body:
      "Pages use semantic HTML and a clear heading structure. Interactive elements are reachable and operable by keyboard, images carry descriptive alternative text, and the color palette is chosen for readable contrast on the dark background.",
  },
  {
    title: "Motion and animation",
    body:
      "The 3D scenes and scroll effects are decorative and hidden from assistive tech. If your device or browser requests reduced motion, the animations are disabled automatically and the site falls back to static, still layouts.",
  },
  {
    title: "Known limitations",
    body:
      "The 3D graphics are visual only and convey no information that isn't also in text. Some embedded third-party content (for example the App Store) follows its own accessibility standards, which I do not control.",
  },
  {
    title: "Feedback",
    body:
      "If you hit an accessibility barrier anywhere on the site, please tell me — I take it seriously and will do my best to fix it quickly. Include the page and what went wrong so I can reproduce it.",
  },
];

export default function Accessibility() {
  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
      <div style={{ maxWidth: T.maxW, margin: "0 auto", padding: "56px 24px 100px" }}>
        <Reveal>
          <Eyebrow n="◦" style={{ marginBottom: 18 }}>sladdagiri.org</Eyebrow>
          <h1 style={{ fontFamily: T.display, fontSize: "clamp(34px, 6vw, 66px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.0, margin: "0 0 18px" }}>
            Accessibility Statement
          </h1>
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, margin: "0 0 40px" }}>
            Last updated: September 2026
          </p>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
          {SECTIONS.map((s, i) => (
            <Reveal key={s.title} y={16} delay={i * 40}>
              <Card hover={false} style={{ padding: 24, height: "100%" }}>
                <h2 style={{ fontFamily: T.display, fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
                  {s.title}
                </h2>
                <p style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.7, color: T.dim, margin: 0 }}>{s.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal y={16}>
          <Card hover={false} style={{ padding: 24 }}>
            <h2 style={{ fontFamily: T.display, fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 10px" }}>Contact</h2>
            <p style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.7, color: T.dim, margin: "0 0 16px" }}>
              Report an accessibility issue at:
            </p>
            <a
              href="mailto:suraj@sladdagiri.org"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10, padding: "11px 16px",
                borderRadius: T.radius, textDecoration: "none", color: T.ink, background: "transparent",
                border: `1px solid ${T.rule}`, fontFamily: T.mono, fontSize: 14,
                transition: "border-color 160ms ease, color 160ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent2; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.rule; e.currentTarget.style.color = T.ink; }}
            >
              suraj@sladdagiri.org
            </a>
          </Card>
        </Reveal>

        <Rule style={{ margin: "40px 0 20px" }} />
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link to="/" style={{ color: T.dim, fontFamily: T.mono, fontSize: 13, textDecoration: "none" }}>Back to home</Link>
          <Link to="/privacy" style={{ color: T.dim, fontFamily: T.mono, fontSize: 13, textDecoration: "none" }}>Privacy</Link>
          <Link to="/terms" style={{ color: T.dim, fontFamily: T.mono, fontSize: 13, textDecoration: "none" }}>Terms</Link>
        </div>
      </div>
    </div>
  );
}
