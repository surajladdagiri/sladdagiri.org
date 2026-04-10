import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function GlassPill({ children }) {
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

function CTAButton({ children, href, onClick, primary = false }) {
  const sharedStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minWidth: 160,
    padding: "13px 20px",
    borderRadius: 999,
    textDecoration: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    transition: "transform 180ms ease, background 180ms ease, border 180ms ease",
    border: primary
      ? "1px solid transparent"
      : "1px solid rgba(255,255,255,0.12)",
    background: primary ? "#f5f5f7" : "rgba(255,255,255,0.04)",
    color: primary ? "#111214" : "#f5f5f7",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  const handleEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.background = primary
      ? "#e9e9ed"
      : "rgba(255,255,255,0.08)";
    e.currentTarget.style.border = primary
      ? "1px solid transparent"
      : "1px solid rgba(255,255,255,0.18)";
  };

  const handleLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.background = primary
      ? "#f5f5f7"
      : "rgba(255,255,255,0.04)";
    e.currentTarget.style.border = primary
      ? "1px solid transparent"
      : "1px solid rgba(255,255,255,0.12)";
  };

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        style={sharedStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      style={sharedStyle}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
    </button>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div
      style={{
        borderRadius: 28,
        padding: "1.35rem",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 14px 40px rgba(0,0,0,0.18)",
        minHeight: 210,
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: "1rem",
          color: "#f5f5f7",
        }}
      >
        {icon}
      </div>

      <h2
        style={{
          margin: "0 0 0.7rem",
          fontSize: 20,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          color: "#f5f5f7",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: 0,
          color: "rgba(255,255,255,0.58)",
          fontSize: 15,
          lineHeight: 1.75,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div
      style={{
        padding: "1rem 1.05rem",
        borderRadius: 22,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.13em",
          color: "rgba(255,255,255,0.32)",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#f5f5f7",
          lineHeight: 1.4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MetricCard({ label, value, description }) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: "1.1rem",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.13em",
          color: "rgba(255,255,255,0.34)",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "clamp(24px, 4vw, 34px)",
          fontWeight: 700,
          letterSpacing: "-0.05em",
          color: "#f5f5f7",
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <p
        style={{
          margin: 0,
          color: "rgba(255,255,255,0.56)",
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function SystemStage({ eyebrow, title, description, accent }) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: "1rem",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: accent,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 20px ${accent}`,
          }}
        />
        {eyebrow}
      </div>

      <h3
        style={{
          margin: "0 0 0.55rem",
          fontSize: 19,
          letterSpacing: "-0.03em",
          color: "#f5f5f7",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          color: "rgba(255,255,255,0.56)",
          fontSize: 14,
          lineHeight: 1.75,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function HavenMark() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 22,
          background:
            "linear-gradient(145deg, rgba(28,154,255,0.9), rgba(255,186,81,0.9))",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.34)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#081019",
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: "0.12em",
        }}
      >
        HAVEN
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.35)",
            marginBottom: 6,
          }}
        >
          Project
        </div>
        <div
          style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            color: "#f5f5f7",
          }}
        >
          HAVEN
        </div>
      </div>
    </div>
  );
}

export default function Haven() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const featureCards = [
    {
      title: "Smartphone-based sensing",
      description:
        "HAVEN uses a LiDAR-equipped iPhone as the perception and compute layer, combining the camera, depth sensor, and IMU into a low-cost wearable navigation stack.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect
            x="7"
            y="3.5"
            width="10"
            height="17"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="17.2" r="0.9" fill="currentColor" />
          <path
            d="M4 8.5H2.5M21.5 8.5H20M4 12H1.5M22.5 12H20M4 15.5H2.5M21.5 15.5H20"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      title: "SLAM-backed path planning",
      description:
        "The software converts live spatial data into a walkable route, using ARKit scene understanding, a forward-goal lock, direct-path preference, and A* fallback when needed.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 18L9.5 12.5L13 16L20 9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 9H20V13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      title: "Directional haptic guidance",
      description:
        "A five-tactor array on a torso or head mount turns heading corrections into weighted motor intensities, plus special patterns for cases such as doors or no valid path ahead.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="10" width="2.4" height="4" rx="1.2" fill="currentColor" />
          <rect x="7.4" y="8.5" width="2.4" height="7" rx="1.2" fill="currentColor" />
          <rect x="11.8" y="7" width="2.4" height="10" rx="1.2" fill="currentColor" />
          <rect x="16.2" y="8.5" width="2.4" height="7" rx="1.2" fill="currentColor" />
          <rect x="20.6" y="10" width="2.4" height="4" rx="1.2" fill="currentColor" />
        </svg>
      ),
    },
    {
      title: "Prototype wearable hardware",
      description:
        "The prototype combines an Arduino Uno R4 WiFi, DRV2605L haptic drivers, an I2C multiplexer, 3D-printed clips, and a torso or head-mounted harness.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 6.5H17L20 10V17.5H4V10L7 6.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 12H15.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="8.5" cy="12" r="0.9" fill="currentColor" />
          <circle cx="15.5" cy="12" r="0.9" fill="currentColor" />
        </svg>
      ),
    },
  ];

  const subprojects = [
    {
      title: "Microcontroller interface",
      description:
        "Wireless communication, motor control, and the haptic driver stack were built around the Arduino Uno R4 WiFi, QWIIC connectivity, and a multiplexer to independently drive all five tactors.",
    },
    {
      title: "Wearable belt system",
      description:
        "The haptic belt, clips, and electronics housing were designed so tactors stay aligned across users while remaining easy to reposition, replace, and protect from damage.",
    },
    {
      title: "Computer vision and routing",
      description:
        "The sensing pipeline explored both a custom stereo-camera C++ prototype and a native Swift implementation, ultimately favoring ARKit-based LiDAR mapping on the iPhone.",
    },
    {
      title: "Environment-to-haptics translation",
      description:
        "Mapped space and path vectors are translated into proportional motor intensities so a discrete five-motor system can still express smooth steering cues.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05), transparent 22%), #0b0b0c",
        color: "#f5f5f7",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes havenFadeRise {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes havenPulse {
          0% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.08); opacity: 0.36; }
          100% { transform: scale(1); opacity: 0.2; }
        }

        @keyframes havenShimmer {
          0% { transform: translateX(-16%); opacity: 0.3; }
          50% { transform: translateX(10%); opacity: 0.52; }
          100% { transform: translateX(-16%); opacity: 0.3; }
        }

        @media (max-width: 1080px) {
          .haven-hero-grid,
          .haven-detail-grid {
            grid-template-columns: 1fr !important;
          }

          .haven-feature-grid,
          .haven-subproject-grid,
          .haven-metric-grid,
          .haven-info-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 720px) {
          .haven-feature-grid,
          .haven-subproject-grid,
          .haven-metric-grid,
          .haven-info-grid,
          .haven-stage-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <section
        style={{
          position: "relative",
          maxWidth: 1280,
          margin: "0 auto",
          padding: "3.8rem 1.5rem 2rem",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 72,
            left: -40,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255,184,77,0.15)",
            filter: "blur(70px)",
            animation: "havenPulse 5.8s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 160,
            right: -60,
            width: 340,
            height: 340,
            borderRadius: "50%",
            background: "rgba(28,154,255,0.15)",
            filter: "blur(80px)",
            animation: "havenPulse 6.4s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 900ms ease, transform 900ms ease",
          }}
        >
          <div
            style={{
              borderRadius: 34,
              border: "1px solid rgba(255,255,255,0.1)",
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025))",
              boxShadow:
                "0 34px 90px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.05) 24%, transparent 48%)",
                animation: "havenShimmer 8.5s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />

            <div
              className="haven-hero-grid"
              style={{
                position: "relative",
                zIndex: 2,
                padding: "2rem",
                display: "grid",
                gridTemplateColumns: "1.02fr 0.98fr",
                gap: "1.5rem",
                alignItems: "stretch",
              }}
            >
              <div>
                <HavenMark />

                <h1
                  style={{
                    margin: "1.4rem 0 1rem",
                    fontSize: "clamp(40px, 7vw, 78px)",
                    lineHeight: 0.94,
                    letterSpacing: "-0.06em",
                    color: "#f5f5f7",
                    maxWidth: 760,
                  }}
                >
                  Haptics and Vision for
                  <br />
                  Environmental Navigation.
                </h1>

                <p
                  style={{
                    margin: 0,
                    maxWidth: 720,
                    fontSize: "clamp(16px, 2vw, 19px)",
                    lineHeight: 1.8,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  HAVEN is a wearable assistive navigation system designed for
                  visually impaired users. It combines smartphone-based computer
                  vision, LiDAR-assisted mapping, and directional haptic
                  feedback so the wearer can detect obstacles, interpret safer
                  walking directions, and move more confidently through
                  unfamiliar spaces.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: "1.4rem",
                  }}
                >
                  <GlassPill>UC San Diego Senior Design 2025</GlassPill>
                  <GlassPill>Group 9</GlassPill>
                  <GlassPill>Smartphone CV + LiDAR</GlassPill>
                  <GlassPill>ARKit + Swift</GlassPill>
                  <GlassPill>Arduino Uno R4 WiFi</GlassPill>
                  <GlassPill>5 haptic tactors</GlassPill>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginTop: "1.6rem",
                  }}
                >
                  <CTAButton primary onClick={() => navigate("/portfolio")}>
                    Back to Portfolio
                  </CTAButton>

                  <CTAButton href="mailto:suraj@sladdagiri.org">
                    Contact
                  </CTAButton>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 30,
                  padding: "1.4rem",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "rgba(255,255,255,0.34)",
                    marginBottom: 10,
                  }}
                >
                  System pipeline
                </div>

                <h2
                  style={{
                    margin: "0 0 0.9rem",
                    fontSize: "clamp(28px, 4vw, 40px)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.04em",
                    color: "#f5f5f7",
                  }}
                >
                  Sense, map, plan, guide.
                </h2>

                <p
                  style={{
                    margin: "0 0 1.2rem",
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  The phone captures camera, LiDAR, and motion data, the
                  navigation engine builds a local map and selects a walkable
                  route, and a five-motor belt communicates direction through
                  proportional vibration patterns.
                </p>

                <div
                  className="haven-stage-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "0.9rem",
                    marginBottom: "0.9rem",
                  }}
                >
                  <SystemStage
                    eyebrow="Perceive"
                    title="Camera + LiDAR capture"
                    description="A LiDAR-equipped iPhone mounted on the torso or head observes the environment while staying aligned with the user's walking direction."
                    accent="#ffbf5f"
                  />
                  <SystemStage
                    eyebrow="Map"
                    title="ARKit spatial understanding"
                    description="ARKit and RealityKit handle SLAM, scene reconstruction, and environment interpretation for obstacles, floor regions, and door-aware cues."
                    accent="#53c5ff"
                  />
                  <SystemStage
                    eyebrow="Plan"
                    title="Path generation"
                    description="The software locks a feasible forward goal, prefers a straight corridor, and falls back to A* when direct travel is blocked or the scene becomes more complex."
                    accent="#90f4ae"
                  />
                  <SystemStage
                    eyebrow="Guide"
                    title="Weighted haptic output"
                    description="Five tactors, driven over Bluetooth through the Arduino stack, translate heading error into continuous directional guidance without overloading the user's hearing."
                    accent="#ff8e73"
                  />
                </div>

                <div
                  className="haven-info-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "0.9rem",
                  }}
                >
                  <InfoCard label="Status" value="Prototype complete, broader testing ongoing" />
                  <InfoCard label="Prototype weight" value="250g excluding phone" />
                  <InfoCard label="Battery target" value="More than 4 hours" />
                  <InfoCard label="Primary audience" value="Visually impaired users" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "1rem 1.5rem 5rem",
        }}
      >
        <div
          className="haven-feature-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "1rem",
            marginBottom: "1rem",
            animation: "havenFadeRise 900ms ease both",
            animationDelay: "120ms",
          }}
        >
          {featureCards.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>

        <div
          className="haven-detail-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.08fr 0.92fr",
            gap: "1rem",
            marginBottom: "1rem",
            animation: "havenFadeRise 950ms ease both",
            animationDelay: "180ms",
          }}
        >
          <div
            style={{
              borderRadius: 30,
              padding: "1.6rem",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 16px 46px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.34)",
                marginBottom: 10,
              }}
            >
              Build breakdown
            </div>

            <h2
              style={{
                margin: "0 0 0.8rem",
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                color: "#f5f5f7",
              }}
            >
              A wearable system across hardware, software, and UX.
            </h2>

            <p
              style={{
                margin: "0 0 1.2rem",
                fontSize: 15,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.58)",
              }}
            >
              HAVEN started as a stereo-camera-and-laptop concept, then evolved
              into a more practical smartphone-centered architecture. That shift
              reduced weight and component complexity while improving real-time
              spatial awareness, portability, comfort, and integration with the
              final haptic hardware stack.
            </p>

            <div
              className="haven-subproject-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0.9rem",
              }}
            >
              {subprojects.map((item) => (
                <div
                  key={item.title}
                  style={{
                    borderRadius: 24,
                    padding: "1rem",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 0.55rem",
                      fontSize: 18,
                      letterSpacing: "-0.03em",
                      color: "#f5f5f7",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      lineHeight: 1.75,
                      color: "rgba(255,255,255,0.56)",
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderRadius: 30,
              padding: "1.6rem",
              background:
                "linear-gradient(155deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 16px 46px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.34)",
                marginBottom: 10,
              }}
            >
              Design targets
            </div>

            <h2
              style={{
                margin: "0 0 0.8rem",
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                color: "#f5f5f7",
              }}
            >
              Safety, accuracy, and wearability drove the prototype.
            </h2>

            <p
              style={{
                margin: "0 0 1.2rem",
                fontSize: 15,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.58)",
              }}
            >
              The project prioritized reliable obstacle awareness, intuitive
              tactile guidance, low wearable mass, and fast response to changing
              scenes. The report also tied the design to IEC 60601, IEC 62304,
              ISO 14971, ISO 9241-920, and ISO/IEC 27001, so safety,
              ergonomics, and data handling stayed part of the design story from
              the start.
            </p>

            <div
              className="haven-metric-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0.9rem",
                marginBottom: "0.9rem",
              }}
            >
              <MetricCard
                label="Detection target"
                value="Up to 5m"
                description="The system was designed to reliably detect static and dynamic obstacles at distances up to five meters."
              />
              <MetricCard
                label="Wearability"
                value="< 300g"
                description="The prototype target stays under 300 grams excluding the phone, with a documented 250 gram build."
              />
              <MetricCard
                label="Battery goal"
                value="> 4 hrs"
                description="The device was designed around extended operation so users are not stranded mid-navigation."
              />
              <MetricCard
                label="Path refresh"
                value="< 1 sec"
                description="Dynamic obstructions should trigger a newly generated safe path in under one second."
              />
            </div>

            <div
              className="haven-info-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0.9rem",
              }}
            >
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
