import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function DotDistortionBackground() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame;
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const mouse = { x: -9999, y: -9999 };
    const smooth = { x: -9999, y: -9999 };
    const influenceRadius = 160;

    const resize = () => {
      width = wrapper.offsetWidth;
      height = wrapper.offsetHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const handlePointerMove = (e) => {
      const rect = wrapper.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handlePointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      smooth.x += (mouse.x - smooth.x) * 0.08;
      smooth.y += (mouse.y - smooth.y) * 0.08;

      const spacing = 28;
      const time = performance.now() * 0.001;

      for (let x = 0; x <= width + spacing; x += spacing) {
        for (let y = 0; y <= height + spacing; y += spacing) {
          const dx = x - smooth.x;
          const dy = y - smooth.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const force = Math.max(0, 1 - dist / influenceRadius);
          const angle = Math.atan2(dy, dx);

          const offset = force * 18;
          const offsetX = Math.cos(angle) * offset;
          const offsetY = Math.sin(angle) * offset;

          const flicker = Math.sin(x * 0.012 + y * 0.01 + time) * 0.12;
          const radius = 0.95 + force * 2.2 + flicker * 0.3;
          const alpha = 0.07 + force * 0.18;

          ctx.beginPath();
          ctx.arc(
            x + offsetX,
            y + offsetY,
            Math.max(0.55, radius),
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fill();
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    draw();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrapper);

    wrapper.addEventListener("pointermove", handlePointerMove);
    wrapper.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      wrapper.removeEventListener("pointermove", handlePointerMove);
      wrapper.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "auto",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 28%, transparent 66%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function MajorPill({ children }) {
  return (
    <div
      style={{
        padding: "10px 16px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.03)",
        color: "rgba(255,255,255,0.86)",
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {children}
    </div>
  );
}

function LinkButton({ href, children, primary = false, onClick }) {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 20px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none",
    letterSpacing: "-0.1px",
    transition: "all 0.2s ease",
    cursor: "pointer",
    minWidth: 130,
  };

  const primaryStyle = primary
    ? {
        background: "#f5f5f7",
        color: "#121212",
        border: "1px solid transparent",
      }
    : {
        background: "rgba(255,255,255,0.04)",
        color: "#f5f5f7",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
    e.currentTarget.style.background = primary
      ? "#e7e7ea"
      : "rgba(255,255,255,0.08)";
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.borderColor = primary
      ? "transparent"
      : "rgba(255,255,255,0.12)";
    e.currentTarget.style.background = primary
      ? "#f5f5f7"
      : "rgba(255,255,255,0.04)";
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        style={{ ...baseStyle, ...primaryStyle }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </button>
    );
  }

  return (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
      style={{ ...baseStyle, ...primaryStyle }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </a>
  );
}

function Resume3DCard({ university, majors }) {
  return (
    <div>
      <div
        style={{
          position: "relative",
          borderRadius: 28,
          overflow: "hidden",
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow:
            "0 30px 70px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top right, rgba(255,255,255,0.06), transparent 45%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "2rem",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "1.5rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "rgba(255,255,255,0.35)",
                marginBottom: "1rem",
              }}
            >
              Education
            </div>

            <h3
              style={{
                fontSize: "clamp(26px, 4vw, 38px)",
                lineHeight: 1.05,
                margin: "0 0 0.75rem",
                color: "#f5f5f7",
                letterSpacing: "-0.04em",
              }}
            >
              Academic Overview
            </h3>

            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.58)",
                fontSize: 15,
                lineHeight: 1.7,
                maxWidth: 520,
              }}
            >
              Currently studying at{" "}
              <strong style={{ color: "#f5f5f7" }}>UC San Diego</strong> with an
              expected graduation in June 2026.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: "1rem 1.1rem",
                borderRadius: 18,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.32)",
                  marginBottom: 8,
                }}
              >
                University
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#f5f5f7",
                }}
              >
                {university}
              </div>
            </div>

            {majors.map((major, index) => (
              <div
                key={index}
                style={{
                  padding: "1rem 1.1rem",
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "rgba(255,255,255,0.32)",
                    marginBottom: 8,
                  }}
                >
                  Major {index + 1}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#f5f5f7",
                    marginBottom: 4,
                  }}
                >
                  {major.major}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  {major.degree}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialIconButton({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
        borderRadius: 999,
        background: "rgba(255,255,255,0.04)",
        color: "#f5f5f7",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        textDecoration: "none",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      }}
    >
      {children}
    </a>
  );
}

export default function Home() {
  const [heroVisible, setHeroVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const baseUrl = import.meta.env.BASE_URL || "/";
  const resumeUrl = `${baseUrl}Suraj_Laddagiri_Resume.pdf`;
  const portraitUrl = `${baseUrl}IMG_8647.jpeg`;

  const university = "University of California, San Diego";

  const majors = [
    {
      major: "Bioengineering: Biotechnology",
      degree: "B.S.",
    },
    {
      major: "Mathematics-Computer Science",
      degree: "B.S.",
    },
    {
      major: "Political Science",
      degree: "B.A.",
    },
  ];

  const locations = ["Chino, CA", "San Diego, CA"];

  return (
    <div
      style={{
        background: "#0b0b0c",
        minHeight: "100vh",
        color: "#f5f5f5",
      }}
    >
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <DotDistortionBackground />

        <div
          style={{
            width: "min(900px, 100%)",
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.9s ease, transform 0.9s ease",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(48px, 8vw, 88px)",
              fontWeight: 700,
              color: "#f5f5f7",
              margin: "0 0 1rem",
              letterSpacing: "-2px",
              lineHeight: 1.02,
            }}
          >
            Hi, I&apos;m Suraj.
          </h1>

          <p
            style={{
              fontSize: "clamp(17px, 2.4vw, 22px)",
              color: "rgba(245,245,247,0.58)",
              maxWidth: 720,
              margin: "0 auto 1.75rem",
              lineHeight: 1.65,
            }}
          >
            This is my personal website where I share my projects, demos, and
            resume. I&apos;m a graduating student at UC San Diego.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "2.2rem",
            }}
          >
            {locations.map((location) => (
              <MajorPill key={location}>{location}</MajorPill>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <LinkButton href={resumeUrl} primary>
              Resume
            </LinkButton>

            <LinkButton onClick={() => navigate("/portfolio")}>
              Portfolio
            </LinkButton>

            <LinkButton onClick={() => navigate("/demos")}>
              Demos
            </LinkButton>

            <SocialIconButton
              href="https://www.linkedin.com/in/suraj-laddagiri-903602272/"
              label="LinkedIn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A2.03 2.03 0 0 0 3.2 5.02c0 1.11.9 2.02 2.02 2.02h.03a2.02 2.02 0 1 0 0-4.04ZM20.44 12.42c0-3.46-1.85-5.07-4.32-5.07-1.99 0-2.88 1.1-3.38 1.87V8.5H9.37c.04.48 0 11.5 0 11.5h3.37v-6.42c0-.34.02-.68.13-.92.27-.68.89-1.39 1.93-1.39 1.36 0 1.9 1.04 1.9 2.57V20h3.37v-7.58Z" />
              </svg>
            </SocialIconButton>

            <SocialIconButton
              href="https://github.com/surajladdagiri"
              label="GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.2-3.37-1.2-.46-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.72 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.7.12 2.5.35 1.9-1.32 2.74-1.05 2.74-1.05.56 1.42.21 2.46.11 2.72.64.72 1.02 1.63 1.02 2.75 0 3.95-2.34 4.82-4.58 5.08.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.84 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z" />
              </svg>
            </SocialIconButton>
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "0 2rem 6rem",
          maxWidth: 1080,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 360px) 1fr",
            gap: "1.5rem",
            alignItems: "stretch",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 28,
              padding: "1.5rem",
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                borderRadius: 22,
                overflow: "hidden",
                marginBottom: "1.25rem",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <img
                src={portraitUrl}
                alt="Suraj portrait"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "rgba(255,255,255,0.32)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Bio
            </div>

            <h2
              style={{
                margin: "0 0 0.75rem",
                fontSize: 28,
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
                color: "#f5f5f7",
              }}
            >
              About Me
            </h2>

            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.58)",
                fontSize: 15,
                lineHeight: 1.75,
              }}
            >
              My name is Suraj Laddagiri, a triple-major at UC San Diego with a
              strong interest in iOS software development, machine learning,
              biotechnology, and politics. I am passionate about building
              thoughtful experiences at the intersection of technology, biology,
              and policy. I am an LA native, currently based in San Diego. Some
              of my extracurricular hobbies include basketball, drones, working
              on cars, and listening to music.
            </p>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 28,
              padding: "1.75rem",
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.32)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Quick Links
              </div>

              <h2
                style={{
                  margin: "0 0 0.9rem",
                  fontSize: 30,
                  lineHeight: 1.1,
                  letterSpacing: "-0.04em",
                  color: "#f5f5f7",
                }}
              >
                Explore My Work
              </h2>

              <p
                style={{
                  margin: "0 0 1.5rem",
                  color: "rgba(255,255,255,0.58)",
                  fontSize: 15,
                  lineHeight: 1.75,
                  maxWidth: 620,
                }}
              >
                You can view my resume, explore my portfolio, or check out live
                demos and projects from here.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <LinkButton href={resumeUrl} primary>
                View Resume
              </LinkButton>

              <LinkButton onClick={() => navigate("/portfolio")}>
                Portfolio
              </LinkButton>

              <LinkButton onClick={() => navigate("/demos")}>
                Demos
              </LinkButton>
            </div>
          </div>
        </div>

        <Resume3DCard university={university} majors={majors} />

        <div
          style={{
            marginTop: "10.5rem",
            textAlign: "center",
            fontSize: 11,
            color: "rgba(255,255,255,0.22)",
            letterSpacing: "-0.01em",
          }}
        >
          i need me a job in this economy bro 😭🙏
        </div>
      </section>
    </div>
  );
}