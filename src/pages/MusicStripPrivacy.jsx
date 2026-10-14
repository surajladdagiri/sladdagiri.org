import { Link } from "react-router-dom";
import { T, Eyebrow, Card, Tag, Rule } from "../theme";
import Reveal from "../Reveal";

const POINTS = [
  {
    title: "Overview",
    body: "The app doesn't collect personal data of any kind.",
  },
  {
    title: "Spotify integration",
    body:
      "The app uses Spotify's SDK so you can connect your Spotify account and see what's playing, including the track name and album art.",
  },
  {
    title: "How music data is handled",
    body:
      "All music data displayed in the app is provided directly by Spotify through their official API.",
  },
  {
    title: "Compliance",
    body:
      "You sign in through Spotify's own login, and the app follows Spotify's developer policies.",
  },
];

const NOTS = [
  "Collect personal information",
  "Store user data on our servers",
  "Share user data with third parties",
  "Track users across apps or websites",
];

const TAGS = ["No data collection", "No server storage", "No third-party sharing", "Spotify official SDK"];

export default function MusicStripPrivacy() {
  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
      <div style={{ maxWidth: T.maxW, margin: "0 auto", padding: "56px 24px 100px" }}>
        <Reveal>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <Link to="/musicstrip" style={{ color: T.dim, fontFamily: T.mono, fontSize: 12, textDecoration: "none" }}>
              Music Strip
            </Link>
            <span style={{ color: T.faint }}>/</span>
            <Eyebrow>Privacy</Eyebrow>
          </div>

          <h1 style={{ fontFamily: T.display, fontSize: "clamp(34px, 6vw, 66px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.0, margin: "0 0 18px" }}>
            Privacy Policy
          </h1>
          <p style={{ fontFamily: T.body, fontSize: 17, lineHeight: 1.7, color: T.dim, maxWidth: 640, margin: "0 0 22px" }}>
            Music Strip doesn&apos;t collect any personal data, so there&apos;s nothing for it to store or share.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
            {TAGS.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
          {POINTS.map((p, i) => (
            <Reveal key={p.title} y={16} delay={i * 60}>
              <Card hover={false} style={{ padding: 24, height: "100%" }}>
                <h2 style={{ fontFamily: T.display, fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
                  {p.title}
                </h2>
                <p style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.7, color: T.dim, margin: 0 }}>{p.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal y={16}>
          <Card hover={false} style={{ padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontFamily: T.display, fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
              This app does not
            </h2>
            <div style={{ display: "grid", gap: 10 }}>
              {NOTS.map((n) => (
                <div key={n} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ color: T.accent, fontFamily: T.mono, fontSize: 14, marginTop: 1 }}>×</span>
                  <span style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.6, color: T.dim }}>{n}</span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal y={16}>
          <Card hover={false} style={{ padding: 24 }}>
            <h2 style={{ fontFamily: T.display, fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
              Contact
            </h2>
            <p style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.7, color: T.dim, margin: "0 0 16px" }}>
              Any questions? Reach me at:
            </p>
            <a
              href="mailto:suraj@sladdagiri.org"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 16px",
                borderRadius: T.radius,
                textDecoration: "none",
                color: T.ink,
                background: "transparent",
                border: `1px solid ${T.rule}`,
                fontFamily: T.mono,
                fontSize: 14,
                transition: "border-color 160ms ease, color 160ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.accent;
                e.currentTarget.style.color = T.accent2;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.rule;
                e.currentTarget.style.color = T.ink;
              }}
            >
              suraj@sladdagiri.org
            </a>
          </Card>
        </Reveal>

        <Rule style={{ margin: "40px 0 20px" }} />
        <Link to="/musicstrip" style={{ color: T.dim, fontFamily: T.mono, fontSize: 13, textDecoration: "none" }}>
          Back to Music Strip
        </Link>
      </div>
    </div>
  );
}
