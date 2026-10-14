import { Link } from "react-router-dom";
import { T, Eyebrow, Card, Tag, Rule } from "../theme";
import Reveal from "../Reveal";

const POINTS = [
  {
    title: "Overview",
    body:
      "HAVEN runs computer vision and path planning directly on the phone. When a companion laptop viewer is used, the phone streams environment and camera data over the same local network the devices are already connected to.",
  },
  {
    title: "How data moves",
    body:
      "Haptic commands are sent from the phone to the Arduino over Bluetooth. Environment geometry and local camera-location data are streamed over local Wi-Fi to the connected laptop viewer. Neither path uses a cloud relay.",
  },
  {
    title: "What stays local",
    body:
      "Mesh data, pose data, haptic commands, and device-to-device connection details stay on the phone, the Arduino, and the viewer laptop.",
  },
  {
    title: "Storage and sharing",
    body:
      "HAVEN has no server that stores navigation data, and it doesn't send that data to analytics or anyone else. If you export logs or change the viewer yourself, where those files go is up to you.",
  },
];

const NOTS = [
  "Upload environment scans to the cloud",
  "Upload local location data to external servers",
  "Relay haptic commands through third-party services",
  "Require cloud connectivity for the core prototype workflow",
];

const TAGS = ["No cloud upload", "Bluetooth haptics", "Local Wi-Fi only", "Personal devices only"];

export default function HavenPrivacy() {
  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
      <div style={{ maxWidth: T.maxW, margin: "0 auto", padding: "56px 24px 100px" }}>
        <Reveal>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <Link to="/haven" style={{ color: T.dim, fontFamily: T.mono, fontSize: 12, textDecoration: "none" }}>
              HAVEN
            </Link>
            <span style={{ color: T.faint }}>/</span>
            <Eyebrow>Privacy</Eyebrow>
          </div>

          <h1 style={{ fontFamily: T.display, fontSize: "clamp(34px, 6vw, 66px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.0, margin: "0 0 18px" }}>
            Privacy Policy
          </h1>
          <p style={{ fontFamily: T.body, fontSize: 17, lineHeight: 1.7, color: T.dim, maxWidth: 640, margin: "0 0 22px" }}>
            HAVEN is designed so that navigation data stays within your own
            devices and network. The system does not upload environment scans,
            location data, or haptic commands to the cloud.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
            {TAGS.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </Reveal>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}
        >
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
              HAVEN does not
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
              Questions about HAVEN privacy or data handling? Reach me at:
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
        <Link to="/haven" style={{ color: T.dim, fontFamily: T.mono, fontSize: 13, textDecoration: "none" }}>
          Back to HAVEN
        </Link>
      </div>
    </div>
  );
}
