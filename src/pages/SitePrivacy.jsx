import { Link } from "react-router-dom";
import { T, Eyebrow, Card, Tag, Rule } from "../theme";
import Reveal from "../Reveal";

const COLLECTED = [
  {
    title: "What this site records",
    body:
      "When you open a page, the site records which page it was, the time, your IP address, and your browser's user-agent string. From the IP, Cloudflare also supplies a rough location (country, region, city) and the name of your internet provider.",
  },
  {
    title: "Why",
    body:
      "This is a personal site, and I look at the logs to see which pages people visit and roughly where they're coming from. I don't run ads, and I don't build profiles of visitors.",
  },
  {
    title: "Where it is stored",
    body:
      "Visit records sit in a private Cloudflare D1 database behind a password-protected admin page, and I'm the only one with access. I don't sell or share the data with anyone.",
  },
  {
    title: "Cookies and tracking",
    body:
      "The public site doesn't set cookies or load any third-party analytics. The only thing kept in a browser is a login token for my private admin pages, which visitors never see.",
  },
  {
    title: "Retention",
    body:
      "I keep records until I clear them, which I do every so often. If you want the records for your IP address deleted, just ask.",
  },
  {
    title: "Your choices",
    body:
      "You never need an account to use the site. If you want to know what's stored for your IP address, email me and I'll tell you, or delete it.",
  },
];

const TAGS = ["No ad cookies", "No third-party trackers", "Not sold or shared", "Personal analytics only"];

export default function SitePrivacy() {
  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
      <div style={{ maxWidth: T.maxW, margin: "0 auto", padding: "56px 24px 100px" }}>
        <Reveal>
          <Eyebrow n="◦" style={{ marginBottom: 18 }}>
            sladdagiri.org
          </Eyebrow>
          <h1 style={{ fontFamily: T.display, fontSize: "clamp(34px, 6vw, 66px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.0, margin: "0 0 18px" }}>
            Privacy Policy
          </h1>
          <p style={{ fontFamily: T.body, fontSize: 17, lineHeight: 1.7, color: T.dim, maxWidth: 640, margin: "0 0 12px" }}>
            This policy covers this website. The apps have their own policies:{" "}
            <Link to="/haven/privacy" style={{ color: T.accent2, textDecoration: "none" }}>HAVEN</Link> and{" "}
            <Link to="/musicstrip/privacy" style={{ color: T.accent2, textDecoration: "none" }}>Music Strip</Link>.
          </p>
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, margin: "0 0 22px" }}>
            Last updated: September 2026
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
            {TAGS.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
          {COLLECTED.map((p, i) => (
            <Reveal key={p.title} y={16} delay={i * 50}>
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
          <Card hover={false} style={{ padding: 24 }}>
            <h2 style={{ fontFamily: T.display, fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
              Contact
            </h2>
            <p style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.7, color: T.dim, margin: "0 0 16px" }}>
              Questions about this policy, or a request about your data? Reach me at:
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
        <Link to="/" style={{ color: T.dim, fontFamily: T.mono, fontSize: 13, textDecoration: "none" }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
