import { useEffect, useState } from "react";

function GlowOrb({ style }) {
  return (
    <div
      style={{
        position: "absolute",
        borderRadius: "50%",
        filter: "blur(70px)",
        opacity: 0.24,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

function PolicyPill({ children }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 14px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.82)",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {children}
    </div>
  );
}

function SectionCard({ title, children, delay = "0ms" }) {
  return (
    <div
      style={{
        borderRadius: 30,
        padding: "1.5rem",
        background:
          "linear-gradient(155deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 20px 55px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
        animation: "fadeRise 900ms ease both",
        animationDelay: delay,
      }}
    >
      <h2
        style={{
          margin: "0 0 0.9rem",
          fontSize: "clamp(22px, 3vw, 30px)",
          lineHeight: 1.08,
          letterSpacing: "-0.04em",
          color: "#f5f5f7",
        }}
      >
        {title}
      </h2>

      <div
        style={{
          fontSize: 15,
          lineHeight: 1.85,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function CheckItem({ children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "0.95rem 1rem",
        borderRadius: 20,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#f5f5f7",
          marginTop: 1,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 12.5L9.2 16.7L19 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div
        style={{
          color: "rgba(255,255,255,0.74)",
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function HavenPrivacy() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.05), transparent 22%), #0b0b0c",
        color: "#f5f5f7",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes fadeRise {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulseGlow {
          0% { opacity: 0.18; transform: scale(1); }
          50% { opacity: 0.34; transform: scale(1.08); }
          100% { opacity: 0.18; transform: scale(1); }
        }

        @media (max-width: 900px) {
          .haven-privacy-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        style={{
          position: "relative",
          maxWidth: 1180,
          margin: "0 auto",
          padding: "4rem 1.5rem 5rem",
        }}
      >
        <GlowOrb
          style={{
            top: 40,
            left: -40,
            width: 280,
            height: 280,
            background: "rgba(255,184,77,0.14)",
            animation: "pulseGlow 5.6s ease-in-out infinite",
          }}
        />
        <GlowOrb
          style={{
            top: 180,
            right: -50,
            width: 320,
            height: 320,
            background: "rgba(28,154,255,0.14)",
            animation: "pulseGlow 6.4s ease-in-out infinite",
          }}
        />

        <section
          style={{
            position: "relative",
            zIndex: 2,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 900ms ease, transform 900ms ease",
            marginBottom: "1.2rem",
          }}
        >
          <div
            style={{
              borderRadius: 34,
              padding: "2rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))",
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at top right, rgba(255,255,255,0.06), transparent 44%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", zIndex: 2 }}>
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "rgba(255,255,255,0.34)",
                  marginBottom: 12,
                }}
              >
                HAVEN
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(42px, 7vw, 82px)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.06em",
                  color: "#f5f5f7",
                  maxWidth: 800,
                }}
              >
                Privacy Policy
              </h1>

              <p
                style={{
                  margin: "1rem 0 1.35rem",
                  maxWidth: 760,
                  fontSize: "clamp(16px, 2vw, 19px)",
                  lineHeight: 1.8,
                  color: "rgba(255,255,255,0.62)",
                }}
              >
                HAVEN is designed so that navigation data stays within your own
                devices and network. The system does not upload environment
                scans, location data, or haptic commands to the cloud.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <PolicyPill>No cloud upload</PolicyPill>
                <PolicyPill>Bluetooth haptic commands</PolicyPill>
                <PolicyPill>Local Wi-Fi streaming only</PolicyPill>
                <PolicyPill>Personal devices only</PolicyPill>
              </div>
            </div>
          </div>
        </section>

        <section
          className="haven-privacy-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: "1rem",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "grid", gap: "1rem" }}>
            <SectionCard title="Overview" delay="80ms">
              <p style={{ margin: 0 }}>
                HAVEN runs computer vision and path planning directly on the
                phone. When a companion laptop viewer is used, the phone streams
                environment and camera data over the same local network the
                devices are already connected to.
              </p>
            </SectionCard>

            <SectionCard title="How data moves" delay="140ms">
              <p style={{ margin: 0 }}>
                Haptic commands are sent from the phone to the Arduino over
                Bluetooth. Environment geometry and local camera-location data
                are streamed over local Wi-Fi to the connected laptop viewer.
                Neither path uses a cloud relay.
              </p>
            </SectionCard>

            <SectionCard title="What stays local" delay="200ms">
              <p style={{ margin: 0 }}>
                Mesh data, pose data, haptic commands, and device-to-device
                connection details stay on the phone, the Arduino, and the
                viewer laptop. The system is intended to keep the data inside
                your own personal devices.
              </p>
            </SectionCard>

            <SectionCard title="Storage and sharing" delay="260ms">
              <p style={{ margin: 0 }}>
                This project page does not describe any server-side storage,
                analytics, or third-party sharing for HAVEN navigation data. If
                you export logs or modify the viewer yourself, you control where
                those files go.
              </p>
            </SectionCard>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            <SectionCard title="HAVEN does not" delay="120ms">
              <div
                style={{
                  display: "grid",
                  gap: 12,
                }}
              >
                <CheckItem>Upload environment scans to the cloud</CheckItem>
                <CheckItem>Upload local location data to external servers</CheckItem>
                <CheckItem>Relay haptic commands through third-party services</CheckItem>
                <CheckItem>Require cloud connectivity for the core prototype workflow</CheckItem>
              </div>
            </SectionCard>

            <SectionCard title="Contact" delay="220ms">
              <p style={{ margin: "0 0 0.8rem" }}>
                If you have questions about HAVEN privacy or data handling, you
                can contact me at:
              </p>

              <a
                href="mailto:suraj@sladdagiri.org"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: 18,
                  textDecoration: "none",
                  color: "#f5f5f7",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontSize: 15,
                  fontWeight: 600,
                  transition: "transform 180ms ease, background 180ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 6.5H20"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4.5 6.5H19.5V17.5H4.5V6.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.5 7.5L12 12.5L18.5 7.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                suraj@sladdagiri.org
              </a>
            </SectionCard>
          </div>
        </section>
      </div>
    </div>
  );
}
