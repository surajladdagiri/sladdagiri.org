import { Link } from "react-router-dom";
import { T, Eyebrow, Card, Rule } from "../theme";
import Reveal from "../Reveal";

const SECTIONS = [
  {
    title: "About this site",
    body:
      "sladdagiri.org is my personal site. By using it you agree to these terms; if you don't agree, please don't use it.",
  },
  {
    title: "Use of the site",
    body:
      "Browse and share links as much as you like. Please don't try to break the site or get into the private parts of it, and don't scrape it hard enough to slow it down or use it for anything illegal.",
  },
  {
    title: "Intellectual property",
    body:
      "The site's text, design, and images are © Suraj Laddagiri unless noted otherwise. Source code linked from the site (for example on GitHub) is governed by whatever license accompanies that repository. App screenshots and trademarks belong to their respective owners.",
  },
  {
    title: "External links",
    body:
      "The site links to other websites, like GitHub, LinkedIn, and the App Store. I don't control those sites and I'm not responsible for what's on them.",
  },
  {
    title: "No warranty",
    body:
      "The site and everything on it is provided \"as is,\" with no warranty of any kind. Some of it may be out of date or incomplete, and none of it is professional, legal, medical, or financial advice.",
  },
  {
    title: "Limitation of liability",
    body:
      "To the extent allowed by law, I am not liable for any damages arising from your use of, or inability to use, the site or anything linked from it.",
  },
  {
    title: "Changes",
    body:
      "I may update these terms. If you keep using the site after a change, you're agreeing to the new version. California law governs them.",
  },
];

export default function Terms() {
  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
      <div style={{ maxWidth: T.maxW, margin: "0 auto", padding: "56px 24px 100px" }}>
        <Reveal>
          <Eyebrow n="◦" style={{ marginBottom: 18 }}>sladdagiri.org</Eyebrow>
          <h1 style={{ fontFamily: T.display, fontSize: "clamp(34px, 6vw, 66px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.0, margin: "0 0 18px" }}>
            Terms of Use
          </h1>
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, margin: "0 0 40px" }}>
            Last updated: September 2026
          </p>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
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

        <Rule style={{ margin: "40px 0 20px" }} />
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link to="/" style={{ color: T.dim, fontFamily: T.mono, fontSize: 13, textDecoration: "none" }}>Back to home</Link>
          <Link to="/privacy" style={{ color: T.dim, fontFamily: T.mono, fontSize: 13, textDecoration: "none" }}>Privacy</Link>
          <Link to="/accessibility" style={{ color: T.dim, fontFamily: T.mono, fontSize: 13, textDecoration: "none" }}>Accessibility</Link>
        </div>
      </div>
    </div>
  );
}
