import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function GlowOrb({ style }) {
  return (
    <div
      style={{
        position: "absolute",
        borderRadius: "50%",
        filter: "blur(60px)",
        opacity: 0.28,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.8)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {children}
    </div>
  );
}

function ActionButton({ children, onClick, primary = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none",
        border: primary
          ? "1px solid transparent"
          : "1px solid rgba(255,255,255,0.12)",
        background: primary ? "#f5f5f7" : "rgba(255,255,255,0.04)",
        color: primary ? "#111214" : "#f5f5f7",
        padding: "12px 18px",
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        cursor: "pointer",
        transition: "transform 180ms ease, background 180ms ease, border 180ms ease",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.background = primary
          ? "#e8e8ec"
          : "rgba(255,255,255,0.08)";
        e.currentTarget.style.border = primary
          ? "1px solid transparent"
          : "1px solid rgba(255,255,255,0.18)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.background = primary
          ? "#f5f5f7"
          : "rgba(255,255,255,0.04)";
        e.currentTarget.style.border = primary
          ? "1px solid transparent"
          : "1px solid rgba(255,255,255,0.12)";
      }}
    >
      {children}
    </button>
  );
}

function FeaturePill({ children }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.03)",
        color: "rgba(255,255,255,0.78)",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        padding: "1rem 1.1rem",
        borderRadius: 22,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.34)",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 650,
          color: "#f5f5f7",
          lineHeight: 1.25,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PhoneFrame({ src, alt, floatDelay = 0, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Zoom ${alt}`}
      style={{
        appearance: "none",
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: "zoom-in",
        position: "relative",
        width: "100%",
        maxWidth: 220,
        transform: hovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "transform 260ms ease",
        animation: `floatCard 4.6s ease-in-out ${floatDelay}s infinite`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          position: "absolute",
          inset: "8% 10% -6% 10%",
          background: "rgba(28,154,255,0.22)",
          filter: "blur(28px)",
          borderRadius: 32,
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          borderRadius: 34,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
          }}
        />
      </div>
    </button>
  );
}

export default function Portfolio() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const baseUrl = import.meta.env.BASE_URL || "/";

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!selectedScreenshot) return undefined;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedScreenshot(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedScreenshot]);

  const screenshots = useMemo(
    () => [
      {
        src: `${baseUrl}IMG_1841.PNG`,
        alt: "Music Strip animations screen",
      },
      {
        src: `${baseUrl}IMG_1844.PNG`,
        alt: "Music Strip controls screen",
      },
      {
        src: `${baseUrl}IMG_1843.PNG`,
        alt: "Music Strip music sync screen",
      },
    ],
    [baseUrl]
  );

  const iconUrl = `${baseUrl}1024.png`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.04), transparent 26%), #0b0b0c",
        color: "#f5f5f7",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes portfolioFadeUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes floatCard {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }

        @keyframes pulseGlow {
          0% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.06); }
          100% { opacity: 0.2; transform: scale(1); }
        }

        @media (max-width: 1080px) {
          .portfolio-project-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 720px) {
          .portfolio-stats-grid,
          .portfolio-preview-grid,
          .portfolio-signal-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        style={{
          position: "relative",
          maxWidth: 1240,
          margin: "0 auto",
          padding: "4.5rem 1.5rem 6rem",
        }}
      >
        <GlowOrb
          style={{
            top: 40,
            left: -60,
            width: 280,
            height: 280,
            background: "rgba(255,208,0,0.18)",
            animation: "pulseGlow 5s ease-in-out infinite",
          }}
        />
        <GlowOrb
          style={{
            top: 260,
            right: -50,
            width: 320,
            height: 320,
            background: "rgba(28,154,255,0.16)",
            animation: "pulseGlow 6s ease-in-out infinite",
          }}
        />

        <section
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 800ms ease, transform 800ms ease",
            marginBottom: "3.5rem",
          }}
        >
          <SectionLabel>Portfolio</SectionLabel>

          <div
            className="portfolio-project-grid"
            style={{
              marginTop: "1.2rem",
              display: "grid",
              gridTemplateColumns: "1.05fr 0.95fr",
              gap: "1.5rem",
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                position: "relative",
                borderRadius: 32,
                padding: "2rem",
                border: "1px solid rgba(255,255,255,0.1)",
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))",
                boxShadow:
                  "0 30px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at top right, rgba(255,255,255,0.07), transparent 42%)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative", zIndex: 2 }}>
                <div
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: 24,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 18px 42px rgba(0,0,0,0.34)",
                    marginBottom: "1.25rem",
                    background: "#000",
                  }}
                >
                  <img
                    src={iconUrl}
                    alt="Music Strip app icon"
                    style={{ width: "100%", height: "100%", display: "block" }}
                  />
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(38px, 6vw, 68px)",
                    lineHeight: 0.96,
                    letterSpacing: "-0.05em",
                    color: "#f5f5f7",
                    maxWidth: 760,
                  }}
                >
                  Music Strip
                </h1>

                <p
                  style={{
                    margin: "1rem 0 1.5rem",
                    fontSize: "clamp(16px, 2vw, 19px)",
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.62)",
                    maxWidth: 720,
                  }}
                >
                  A custom Bluetooth-controlled lighting experience for WS2812B
                  LED strips, built around an ESP32 and wrapped in an iOS app
                  with music reactive features, elegant controls, and dynamic
                  color extraction from currently playing album art.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginBottom: "1.6rem",
                  }}
                >
                  <FeaturePill>Bluetooth control</FeaturePill>
                  <FeaturePill>Static colors</FeaturePill>
                  <FeaturePill>Animations</FeaturePill>
                  <FeaturePill>Brightness + speed</FeaturePill>
                  <FeaturePill>Spotify-inspired sync</FeaturePill>
                  <FeaturePill>ESP32 + WS2812B</FeaturePill>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <ActionButton primary onClick={() => navigate("/musicstrip")}>
                    View Music Strip
                  </ActionButton>

                  <ActionButton onClick={() => navigate("/musicstrip/privacy")}>
                    Privacy Policy
                  </ActionButton>
                </div>
              </div>
            </div>

            <div
              style={{
                borderRadius: 32,
                padding: "1.3rem",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.26)",
                display: "grid",
                gridTemplateRows: "auto auto",
                gap: "1rem",
              }}
            >
              <div
                className="portfolio-stats-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <StatCard label="Platform" value="iOS + ESP32" />
                <StatCard label="Core Protocol" value="Bluetooth" />
                <StatCard label="Lighting" value="WS2812B LEDs" />
                <StatCard label="Focus" value="Music reactive ambience" />
              </div>

              <div
                style={{
                  borderRadius: 26,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                  padding: "1.1rem",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.13em",
                    color: "rgba(255,255,255,0.34)",
                    marginBottom: 14,
                  }}
                >
                  App Preview
                </div>

                <div
                  className="portfolio-preview-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "0.9rem",
                    alignItems: "end",
                    justifyItems: "center",
                  }}
                >
                  {screenshots.map((item, index) => (
                    <PhoneFrame
                      key={item.alt}
                      src={item.src}
                      alt={item.alt}
                      floatDelay={index * 0.35}
                      onClick={() => setSelectedScreenshot(item)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            animation: visible ? "portfolioFadeUp 900ms ease both" : "none",
            animationDelay: "120ms",
            marginBottom: "1.5rem",
          }}
        >
          <div
            className="portfolio-project-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "0.98fr 1.02fr",
              gap: "1rem",
            }}
          >
            <div
              style={{
                position: "relative",
                borderRadius: 32,
                padding: "2rem",
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(150deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))",
                boxShadow: "0 22px 58px rgba(0,0,0,0.26)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at top left, rgba(28,154,255,0.1), transparent 38%)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative", zIndex: 2 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background:
                      "linear-gradient(145deg, rgba(28,154,255,0.22), rgba(255,186,81,0.16))",
                    color: "#f5f5f7",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: "1.1rem",
                  }}
                >
                  HAVEN
                </div>

                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "rgba(255,255,255,0.34)",
                    marginBottom: 10,
                  }}
                >
                  UC San Diego Senior Design 2025
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "clamp(32px, 5vw, 56px)",
                    lineHeight: 0.98,
                    letterSpacing: "-0.05em",
                    color: "#f5f5f7",
                    maxWidth: 760,
                  }}
                >
                  Haptics and Vision for Environmental Navigation (HAVEN)
                </h2>

                <p
                  style={{
                    margin: "1rem 0 1.5rem",
                    fontSize: "clamp(16px, 2vw, 18px)",
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.62)",
                    maxWidth: 740,
                  }}
                >
                  A wearable navigation system for visually impaired users that
                  combines smartphone-based computer vision, LiDAR-assisted
                  spatial mapping, and a five-point haptic belt to detect
                  obstacles and guide safer movement through unfamiliar spaces.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginBottom: "1.6rem",
                  }}
                >
                  <FeaturePill>Smartphone CV + LiDAR</FeaturePill>
                  <FeaturePill>ARKit SLAM</FeaturePill>
                  <FeaturePill>Real-time path planning</FeaturePill>
                  <FeaturePill>5 tactors</FeaturePill>
                  <FeaturePill>Arduino + Bluetooth</FeaturePill>
                  <FeaturePill>Proof-of-concept trials</FeaturePill>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <ActionButton primary onClick={() => navigate("/haven")}>
                    View HAVEN
                  </ActionButton>
                </div>
              </div>
            </div>

            <div
              style={{
                borderRadius: 32,
                padding: "1.3rem",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
                display: "grid",
                gridTemplateRows: "auto auto",
                gap: "1rem",
              }}
            >
              <div
                className="portfolio-stats-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <StatCard label="Platform" value="iPhone Pro + Arduino" />
                <StatCard label="Sensors" value="Camera + LiDAR" />
                <StatCard label="Output" value="5 haptic tactors" />
                <StatCard label="Focus" value="Collision-free navigation" />
              </div>

              <div
                style={{
                  borderRadius: 26,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                  padding: "1.1rem",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.13em",
                    color: "rgba(255,255,255,0.34)",
                    marginBottom: 14,
                  }}
                >
                  Project snapshot
                </div>

                <div
                  className="portfolio-signal-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.9rem",
                  }}
                >
                  {[
                    {
                      label: "Perceive",
                      title: "Live spatial sensing",
                      text: "A LiDAR-equipped iPhone captures camera, depth, and motion data from a torso or head-mounted viewpoint.",
                    },
                    {
                      label: "Plan",
                      title: "Walkable path generation",
                      text: "The navigation logic finds a feasible forward route, then updates when obstacles or dead ends appear.",
                    },
                    {
                      label: "Guide",
                      title: "Haptic translation",
                      text: "Five tactors translate heading corrections into directional vibration without covering up ambient sound.",
                    },
                    {
                      label: "Validate",
                      title: "Prototype and testing",
                      text: "The proof-of-concept system is complete and has been trialed in controlled, blindfolded-user scenarios with broader testing still underway.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      style={{
                        borderRadius: 22,
                        padding: "0.95rem",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.13em",
                          color: "rgba(255,255,255,0.36)",
                          marginBottom: 8,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 650,
                          color: "#f5f5f7",
                          lineHeight: 1.25,
                          marginBottom: 8,
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          lineHeight: 1.65,
                          color: "rgba(255,255,255,0.56)",
                        }}
                      >
                        {item.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            animation: visible ? "portfolioFadeUp 900ms ease both" : "none",
            animationDelay: "180ms",
          }}
        >
          <div
            style={{
              borderRadius: 32,
              padding: "2rem",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.2)",
              textAlign: "center",
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
              More to come
            </div>

            <h2
              style={{
                margin: "0 0 0.85rem",
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
                color: "#f5f5f7",
              }}
            >
              More projects will be added soon.
            </h2>

            <p
              style={{
                margin: 0,
                maxWidth: 720,
                marginInline: "auto",
                fontSize: 15,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.56)",
              }}
            >
             Work in progress!
            </p>
          </div>
        </section>
      </div>

      {selectedScreenshot ? (
        <div
          onClick={() => setSelectedScreenshot(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1400,
            background: "rgba(5,6,8,0.88)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1.25rem",
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedScreenshot(null)}
            aria-label="Close screenshot preview"
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              width: 44,
              height: 44,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "#f5f5f7",
              fontSize: 22,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>

          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(92vw, 1200px)",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <img
              src={selectedScreenshot.src}
              alt={selectedScreenshot.alt}
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "80vh",
                width: "auto",
                height: "auto",
                borderRadius: 28,
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
                background: "#0b0b0c",
              }}
            />

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.78)",
                fontSize: 13,
                lineHeight: 1.4,
                textAlign: "center",
              }}
            >
              {selectedScreenshot.alt}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
