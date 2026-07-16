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

function CTAButton({ children, href, onClick, primary = false, download = false }) {
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
        download={download || undefined}
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

function HookCard({ symbol, method, effect }) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: "1rem",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 650,
          color: "#f5f5f7",
          marginBottom: 4,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
      >
        {symbol}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.4)",
          marginBottom: 8,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
      >
        {method}
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.56)",
        }}
      >
        {effect}
      </div>
    </div>
  );
}

function IGAdBlockMark() {
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
            "linear-gradient(145deg, rgba(255,90,95,0.9), rgba(120,80,255,0.85))",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.34)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#180a12",
          flexShrink: 0,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M6.2 6.2L17.8 17.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
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
          IGAdBlock
        </div>
      </div>
    </div>
  );
}

export default function IGAdBlock() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  const githubUrl = "https://github.com/surajladdagiri/IGAdBlock";
  const releasesUrl = "https://github.com/surajladdagiri/IGAdBlock/releases/latest";
  const workflowUrl =
    "https://github.com/surajladdagiri/IGAdBlock/blob/main/.github/workflows/makefile.yml";

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const featureCards = [
    {
      title: "Reels feed ad removal",
      description:
        "Hooks IGSundialFeedDataSource's objectsForListAdapter: and rebuilds the returned array, dropping any item that is an instance of IGAdItem before the Reels UI ever renders it.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect
            x="6"
            y="4"
            width="12"
            height="16"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M9.5 9L14.5 12L9.5 15V9Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      title: "Main feed ads + Threads suggestions",
      description:
        "Hooks IGMainFeedListAdapterDataSource to filter out IGAdItem entries and the Swift-mangled suggestion cards from the main timeline.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 6.5H20M4 12H20M4 17.5H14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      title: "TestFlight nudge suppression",
      description:
        "Hooks UIViewController's presentViewController to intercept TestFlightUpdateNudgeViewController before it presents, with a backup viewDidAppear: hook that dismisses it immediately if it slips through.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3.5L20 7.5V12.2C20 16.4 16.9 19.9 12 20.5C7.1 19.9 4 16.4 4 12.2V7.5L12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 12L11.2 14.2L15.5 9.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      title: "Version-resilient Swift hooking",
      description:
        "Swift-backed classes like IGSundialFeed. IGSundialFeedDataSource are resolved with objc_getClass at load time and only wired up through Logos %group/%init if found, so a renamed symbol degrades gracefully instead of crashing Instagram.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4V8M12 16V20M4 12H8M16 12H20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ),
    },
  ];

  const subprojects = [
    {
      title: "Feed data interception",
      description:
        "Two Logos hooks target the Objective-C list adapters that back Reels and the main feed, filtering their returned item arrays by class before ListKit ever lays them out.",
    },
    {
      title: "Dynamic Swift class resolution",
      description:
        "A %ctor constructor calls objc_getClass on the mangled Swift Reels data-source and TestFlight nag view controller names, only %init'ing the matching %group hooks when the class is actually present.",
    },
    {
      title: "System nudge blocking",
      description:
        "A global UIViewController hook inspects every view controller about to be presented app-wide and swallows the TestFlight update nudge specifically, calling through to the original completion block so nothing else breaks.",
    },
    {
      title: "Universal binary packaging",
      description:
        "Theos compiles the tweak as a MobileSubstrate dylib for arm64 and arm64e targeting iOS 15.0+, filtered at load time to only the com.burbn.instagram bundle via IGAdBlock.plist.",
    },
  ];

  const hooks = [
    {
      symbol: "IGSundialFeedDataSource",
      method: "-objectsForListAdapter:",
      effect: "Strips IGAdItem entries out of the Reels feed's data source.",
    },
    {
      symbol: "IGMainFeedListAdapterDataSource",
      method: "-objectsForListAdapter:",
      effect:
        "Strips IGAdItem and IGThreadsInFeedModels. IGThreadsInFeedModel from the main feed.",
    },
    {
      symbol: "UIViewController",
      method: "-presentViewController: animated:completion:",
      effect:
        "Intercepts and cancels presentation of the TestFlight update nudge view controller.",
    },
    {
      symbol: "IGSundialFeed. IGSundialFeedDataSource (Swift)",
      method: "-objectsForListAdapter:",
      effect:
        "Same ad filter as the Objective-C hook, applied to the Swift reimplementation when present.",
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
        @keyframes igabFadeRise {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes igabPulse {
          0% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.08); opacity: 0.36; }
          100% { transform: scale(1); opacity: 0.2; }
        }

        @keyframes igabShimmer {
          0% { transform: translateX(-16%); opacity: 0.3; }
          50% { transform: translateX(10%); opacity: 0.52; }
          100% { transform: translateX(-16%); opacity: 0.3; }
        }

        @media (max-width: 1080px) {
          .igab-hero-grid,
          .igab-detail-grid,
          .igab-resource-grid {
            grid-template-columns: 1fr !important;
          }

          .igab-feature-grid,
          .igab-subproject-grid,
          .igab-hook-grid,
          .igab-info-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 720px) {
          .igab-feature-grid,
          .igab-subproject-grid,
          .igab-hook-grid,
          .igab-info-grid {
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
            background: "rgba(255,90,95,0.14)",
            filter: "blur(70px)",
            animation: "igabPulse 5.8s ease-in-out infinite",
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
            background: "rgba(120,80,255,0.14)",
            filter: "blur(80px)",
            animation: "igabPulse 6.4s ease-in-out infinite",
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
                animation: "igabShimmer 8.5s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />

            <div
              className="igab-hero-grid"
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
                <IGAdBlockMark />

                <h1
                  style={{
                    margin: "1.4rem 0 1rem",
                    fontSize: "clamp(38px, 6.5vw, 68px)",
                    lineHeight: 0.96,
                    letterSpacing: "-0.06em",
                    color: "#f5f5f7",
                    maxWidth: 760,
                  }}
                >
                  Ad blocking for Instagram,
                  <br />
                  at the runtime layer.
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
                  IGAdBlock is a MobileSubstrate tweak built with Theos and
                  Logos for jailbroken or jailed iOS environment. It hooks Instagram's Objective-C
                  and Swift feed data sources directly, filtering ads,
                  Threads suggestions, and TestFlight nag screens out of the
                  data before they ever reach the UI.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: "1.4rem",
                  }}
                >
                  <GlassPill>Theos + Logos</GlassPill>
                  <GlassPill>Objective-C runtime hooking</GlassPill>
                  <GlassPill>MobileSubstrate</GlassPill>
                  <GlassPill>arm64 / arm64e</GlassPill>
                  <GlassPill>GitHub Actions CI</GlassPill>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginTop: "1.6rem",
                  }}
                >
                  <CTAButton href={githubUrl} primary>
                    View on GitHub
                  </CTAButton>

                  <CTAButton href={releasesUrl}>Latest Release</CTAButton>

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
                  What gets filtered
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
                  Reels, feed, and system nags.
                </h2>

                <p
                  style={{
                    margin: "0 0 1.2rem",
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  Each hook rebuilds the array Instagram's feed adapters
                  return, dropping ad and suggestion objects by class before
                  ListKit ever lays them out, and a separate hook stops the
                  TestFlight update nudge from being presented at all.
                </p>

                <div
                  className="igab-info-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "0.9rem",
                  }}
                >
                  <InfoCard label="Reels" value="IGAdItem removed" />
                  <InfoCard label="Main feed" value="Ads + Threads removed" />
                  <InfoCard label="System" value="TestFlight nag blocked" />
                  <InfoCard label="Data collected" value="None, on-device only" />
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
          className="igab-feature-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "1rem",
            marginBottom: "1rem",
            animation: "igabFadeRise 900ms ease both",
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
          className="igab-detail-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.08fr 0.92fr",
            gap: "1rem",
            marginBottom: "1rem",
            animation: "igabFadeRise 950ms ease both",
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
              A single Logos file doing four jobs at once.
            </h2>

            <p
              style={{
                margin: "0 0 1.2rem",
                fontSize: 15,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.58)",
              }}
            >
              The entire tweak lives in one Tweak.x, mixing static
              Objective-C hooks with conditional Logos %group blocks that
              only activate against Swift classes Instagram actually ships
              in a given build, so ad blocking survives across app updates.
            </p>

            <div
              className="igab-subproject-grid"
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
              Hook map
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
              Every class and method the tweak touches.
            </h2>

            <p
              style={{
                margin: "0 0 1.2rem",
                fontSize: 15,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.58)",
              }}
            >
              Four %hook blocks cover the full surface area: two Objective-C
              feed adapters, one app-wide presentation guard, and one
              runtime-resolved Swift equivalent.
            </p>

            <div
              className="igab-hook-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0.9rem",
              }}
            >
              {hooks.map((hook) => (
                <HookCard
                  key={hook.symbol}
                  symbol={hook.symbol}
                  method={hook.method}
                  effect={hook.effect}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          className="igab-resource-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "0.96fr 1.04fr",
            gap: "1rem",
            animation: "igabFadeRise 1000ms ease both",
            animationDelay: "240ms",
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
              Build and install
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
              Grab a release, or build it from source.
            </h2>

            <p
              style={{
                margin: "0 0 1.1rem",
                fontSize: 15,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.58)",
              }}
            >
              Building from source needs Theos and a decrypted Instagram
              IPA supplied by the user. Prebuilt releases ship a universal
              dylib that gets injected into a resigned Instagram IPA
              alongside a keychain-fix tweak, then installed on a jailed
              device with a signing app.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: "1rem",
              }}
            >
              <CTAButton href={githubUrl} primary>
                View on GitHub
              </CTAButton>
              <CTAButton href={releasesUrl}>Latest Release</CTAButton>
              <CTAButton onClick={() => navigate("/portfolio")}>
                Back to Portfolio
              </CTAButton>
            </div>

            <div
              className="igab-info-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0.9rem",
              }}
            >
              <InfoCard label="Package ID" value="com.sladdagiri.igadblock" />
              <InfoCard label="Target bundle" value="com.burbn.instagram" />
              <InfoCard label="Min iOS" value="15.0" />
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
              Continuous integration
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
              Tagging a commit is the whole release process.
            </h2>

            <p
              style={{
                margin: "0 0 1.1rem",
                fontSize: 15,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.58)",
              }}
            >
              A GitHub Actions workflow watches for pushed <code>v*</code>{" "}
              tags, spins up a macOS runner, bootstraps Theos from its
              official install script, and compiles the tweak with{" "}
              <code>make FINALPACKAGE=1</code>.
            </p>

            <div
              style={{
                borderRadius: 22,
                padding: "1rem 1.05rem",
                background: "rgba(4,10,18,0.86)",
                border: "1px solid rgba(255,90,95,0.18)",
                color: "#ffe3e5",
                fontSize: 13,
                lineHeight: 1.9,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                marginBottom: "1rem",
                overflowX: "auto",
              }}
            >
              on: push tags: v*
              <br />
              runs-on: macos-latest
              <br />
              install-theos → make FINALPACKAGE=1
              <br />
              find .theos/obj -name "*.dylib"
              <br />
              softprops/action-gh-release → upload dylib
            </div>

            <div
              className="igab-info-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0.9rem",
                marginBottom: "1rem",
              }}
            >
              <InfoCard label="Trigger" value="Push of a v* tag" />
              <InfoCard label="Runner" value="macos-latest" />
              <InfoCard label="Toolchain" value="Theos, bootstrapped fresh per run" />
              <InfoCard label="Output" value="Universal arm64 / arm64e dylib" />
            </div>

            <CTAButton href={workflowUrl}>View Workflow File</CTAButton>
          </div>
        </div>
      </section>
    </div>
  );
}
