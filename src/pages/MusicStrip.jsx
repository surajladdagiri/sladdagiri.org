import { useEffect, useMemo, useState } from "react";
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

function CTAButton({
  children,
  href,
  onClick,
  primary = false,
  download = false,
}) {
  const sharedStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minWidth: 156,
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
        download={download}
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
        minHeight: 190,
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

      <h3
        style={{
          margin: "0 0 0.7rem",
          fontSize: 20,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          color: "#f5f5f7",
        }}
      >
        {title}
      </h3>

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

function PhoneShot({ src, alt }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "8% 12% -8% 12%",
          background: "rgba(28,154,255,0.18)",
          filter: "blur(32px)",
          borderRadius: 34,
        }}
      />
      <div
        style={{
          position: "relative",
          borderRadius: 34,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          boxShadow:
            "0 30px 70px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.06)",
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
    </div>
  );
}

function MusicStripMark({ iconUrl }) {
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
          overflow: "hidden",
          background: "#000",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
          flexShrink: 0,
        }}
      >
        <img
          src={iconUrl}
          alt="Music Strip app icon"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
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
          Music Strip
        </div>
      </div>
    </div>
  );
}

export default function MusicStrip() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const baseUrl = import.meta.env.BASE_URL || "/";

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const iconUrl = `${baseUrl}1024.png`;
  const zipUrl = `${baseUrl}musicstrip_esp32_fw.zip`;

  const screenshots = useMemo(
    () => [
      {
        src: `${baseUrl}IMG_1841.PNG`,
        alt: "Animations screen",
      },
      {
        src: `${baseUrl}IMG_1844.PNG`,
        alt: "Brightness and speed controls",
      },
      {
        src: `${baseUrl}IMG_1843.PNG`,
        alt: "Music sync screen",
      },
      {
        src: `${baseUrl}IMG_1845.PNG`,
        alt: "Bluetooth auto connect screen",
      },
    ],
    [baseUrl]
  );

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

        @keyframes shimmerMove {
          0% {
            transform: translateX(-12%);
            opacity: 0.35;
          }
          50% {
            transform: translateX(8%);
            opacity: 0.55;
          }
          100% {
            transform: translateX(-12%);
            opacity: 0.35;
          }
        }

        @keyframes haloPulse {
          0% { transform: scale(1); opacity: 0.22; }
          50% { transform: scale(1.08); opacity: 0.38; }
          100% { transform: scale(1); opacity: 0.22; }
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
            top: 80,
            left: -50,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "rgba(255,214,10,0.14)",
            filter: "blur(60px)",
            animation: "haloPulse 5.5s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 180,
            right: -60,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(28,154,255,0.14)",
            filter: "blur(70px)",
            animation: "haloPulse 6.2s ease-in-out infinite",
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
                  "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.05) 22%, transparent 46%)",
                animation: "shimmerMove 8s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 2,
                padding: "2rem",
                display: "grid",
                gridTemplateColumns: "1.05fr 0.95fr",
                gap: "1.5rem",
                alignItems: "center",
              }}
            >
              <div>
                <MusicStripMark iconUrl={iconUrl} />

                <h1
                  style={{
                    margin: "1.4rem 0 1rem",
                    fontSize: "clamp(40px, 7vw, 78px)",
                    lineHeight: 0.94,
                    letterSpacing: "-0.06em",
                    color: "#f5f5f7",
                    maxWidth: 720,
                  }}
                >
                  Smart ambient lighting,
                  <br />
                  built around your music.
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
                  Music Strip is an iOS companion app for a custom ESP32-powered
                  WS2812B lighting setup. It lets you connect over Bluetooth,
                  choose static colors, trigger animations, tune brightness and
                  speed, and create music-reactive moods inspired by currently
                  playing album art.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: "1.4rem",
                  }}
                >
                  <GlassPill>Bluetooth</GlassPill>
                  <GlassPill>ESP32</GlassPill>
                  <GlassPill>WS2812B LEDs</GlassPill>
                  <GlassPill>Animations</GlassPill>
                  <GlassPill>Spotify-inspired colors</GlassPill>
                  <GlassPill>Real-time control</GlassPill>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginTop: "1.6rem",
                  }}
                >
                  <CTAButton href={zipUrl} primary download>
                    Download ESP32 Firmware
                  </CTAButton>

                  <CTAButton onClick={() => navigate("/musicstrip/privacy")}>
                    Privacy Policy
                  </CTAButton>

                  <CTAButton href="mailto:suraj@sladdagiri.org">
                    Contact
                  </CTAButton>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "1rem",
                  alignItems: "end",
                }}
              >
                {screenshots.slice(0, 4).map((shot) => (
                  <PhoneShot key={shot.alt} src={shot.src} alt={shot.alt} />
                ))}
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
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "1rem",
            marginBottom: "1rem",
            animation: "fadeRise 900ms ease both",
            animationDelay: "120ms",
          }}
        >
          <FeatureCard
            title="Bluetooth control"
            description="Connect directly to your custom ESP32 controller and manage your lighting setup from a clean, mobile-first interface."
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3L17 8L13.5 11.5L17 15L12 20V13L8.5 16.5M8.5 7.5L12 11"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />

          <FeatureCard
            title="Dynamic lighting modes"
            description="Switch between static color, transition effects, animated modes, and direct manual control while adjusting brightness and speed."
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3C8.13 3 5 6.13 5 10c0 2.34 1.14 4.41 2.9 5.68.51.37.83.95.83 1.58V18a1 1 0 0 0 1 1h4.54a1 1 0 0 0 1-1v-.74c0-.63.31-1.2.82-1.57A6.98 6.98 0 0 0 19 10c0-3.87-3.13-7-7-7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M9.5 21h5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            }
          />

          <FeatureCard
            title="Music-aware color extraction"
            description="Pull currently playing album art, derive key colors, and turn the light strip into a reactive visual extension of what you are listening to."
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18V7.5L18 6V16.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="6.5" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="15.5" cy="16.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            }
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1rem",
            animation: "fadeRise 950ms ease both",
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
              What it includes
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
              Hardware + app workflow
            </h2>

            <p
              style={{
                margin: "0 0 1.2rem",
                fontSize: 15,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.58)",
              }}
            >
              The project combines embedded control and polished mobile UX. The
              app serves as the front-end controller, while the ESP32 drives the
              LED strip behavior and receives commands over Bluetooth.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0.9rem",
              }}
            >
              <InfoCard label="Microcontroller" value="ESP32" />
              <InfoCard label="LED type" value="WS2812B" />
              <InfoCard label="Connection" value="Bluetooth" />
              <InfoCard label="Support" value="suraj@sladdagiri.org" />
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
              Resources
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
              Download and learn more
            </h2>

            <p
              style={{
                margin: "0 0 1.2rem",
                fontSize: 15,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.58)",
              }}
            >
              You can download the ESP32 code bundle below, review the privacy
              policy, or reach out directly for questions about the app,
              hardware setup, or implementation details.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <CTAButton href={zipUrl} primary download>
                Download Firmware
              </CTAButton>
              <CTAButton onClick={() => navigate("/musicstrip/privacy")}>
                View Privacy Policy
              </CTAButton>
              <CTAButton href="mailto:suraj@sladdagiri.org">
                suraj@sladdagiri.org
              </CTAButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}