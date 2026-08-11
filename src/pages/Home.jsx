import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { T, Eyebrow, Rule, SectionHead, Btn, Card } from "../theme";

/* Interactive dot field, a bespoke canvas, kept because it's hand-built
   personality rather than a generic gradient. Toned to hairline whites. */
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
      const spacing = 30;
      const time = performance.now() * 0.001;

      for (let x = 0; x <= width + spacing; x += spacing) {
        for (let y = 0; y <= height + spacing; y += spacing) {
          const dx = x - smooth.x;
          const dy = y - smooth.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const force = Math.max(0, 1 - dist / influenceRadius);
          const angle = Math.atan2(dy, dx);
          const offset = force * 16;
          const offsetX = Math.cos(angle) * offset;
          const offsetY = Math.sin(angle) * offset;
          const flicker = Math.sin(x * 0.012 + y * 0.01 + time) * 0.12;
          const radius = 0.9 + force * 2.0 + flicker * 0.3;
          // dots turn amber near the cursor, the one accent, used sparingly
          const alpha = 0.05 + force * 0.16;
          ctx.beginPath();
          ctx.arc(x + offsetX, y + offsetY, Math.max(0.5, radius), 0, Math.PI * 2);
          ctx.fillStyle =
            force > 0.35
              ? `rgba(233,182,74,${alpha + 0.05})`
              : `rgba(236,236,236,${alpha})`;
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
    <div ref={wrapperRef} style={{ position: "absolute", inset: 0 }}>
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
    </div>
  );
}

function Social({ href, label, children }) {
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
        width: 44,
        height: 44,
        borderRadius: T.radius,
        background: "transparent",
        color: T.ink,
        border: `1px solid ${T.rule}`,
        transition: "border-color 160ms ease, background 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = T.ruleStrong;
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = T.rule;
        e.currentTarget.style.background = "transparent";
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
    const timer = setTimeout(() => setHeroVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const baseUrl = import.meta.env.BASE_URL || "/";
  const resumeUrl = `${baseUrl}Suraj_Laddagiri_Resume.pdf`;
  const portraitUrl = `${baseUrl}IMG_8647.jpeg`;

  const majors = [
    { major: "Mathematics–Computer Science", degree: "B.S." },
    { major: "Bioengineering: Biotechnology", degree: "B.S." },
    { major: "Political Science", degree: "B.A." },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink }}>
      {/* ---- hero ---- */}
      <section
        style={{
          minHeight: "88vh",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <DotDistortionBackground />
        <div
          style={{
            width: "100%",
            maxWidth: T.maxW,
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          <Eyebrow n="◦" style={{ marginBottom: 22 }}>
            iOS &amp; ML Engineer · UC San Diego
          </Eyebrow>

          <h1
            style={{
              fontFamily: T.display,
              fontSize: "clamp(44px, 8vw, 92px)",
              fontWeight: 600,
              letterSpacing: "-0.045em",
              lineHeight: 0.98,
              margin: "10px 0 0",
              maxWidth: 900,
            }}
          >
            Suraj Laddagiri
          </h1>

          <p
            style={{
              fontFamily: T.body,
              fontSize: "clamp(16px, 2.2vw, 20px)",
              color: T.dim,
              maxWidth: 640,
              margin: "26px 0 34px",
              lineHeight: 1.6,
            }}
          >
            I write iOS apps and have put two of them on the App Store. I also
            build Bluetooth hardware and train machine-learning models. I
            graduate from UC San Diego in September 2026.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <Btn href={resumeUrl} variant="solid" target="_blank">
              Resume
            </Btn>
            <Btn onClick={() => navigate("/portfolio")}>Work</Btn>
            <Btn onClick={() => navigate("/demos")}>Demos</Btn>
            <Social href="https://www.linkedin.com/in/suraj-laddagiri-903602272/" label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A2.03 2.03 0 0 0 3.2 5.02c0 1.11.9 2.02 2.02 2.02h.03a2.02 2.02 0 1 0 0-4.04ZM20.44 12.42c0-3.46-1.85-5.07-4.32-5.07-1.99 0-2.88 1.1-3.38 1.87V8.5H9.37c.04.48 0 11.5 0 11.5h3.37v-6.42c0-.34.02-.68.13-.92.27-.68.89-1.39 1.93-1.39 1.36 0 1.9 1.04 1.9 2.57V20h3.37v-7.58Z" />
              </svg>
            </Social>
            <Social href="https://github.com/surajladdagiri" label="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.2-3.37-1.2-.46-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.72 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.7.12 2.5.35 1.9-1.32 2.74-1.05 2.74-1.05.56 1.42.21 2.46.11 2.72.64.72 1.02 1.63 1.02 2.75 0 3.95-2.34 4.82-4.58 5.08.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.84 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z" />
              </svg>
            </Social>
          </div>
        </div>
      </section>

      {/* ---- about ---- */}
      <section style={{ padding: "40px 24px 120px", maxWidth: T.maxW, margin: "0 auto" }}>
        <style>{`
          @media (max-width: 640px) {
            .home-about-grid { grid-template-columns: 1fr !important; }
            .home-about-grid img { max-height: 320px; }
          }
        `}</style>
        <SectionHead index="01" label="About" title="A bit about me" />

        <div
          className="home-about-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)",
            gap: 24,
            alignItems: "start",
          }}
        >
          <Card hover={false} style={{ padding: 20 }}>
            <div
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                borderRadius: T.radius,
                overflow: "hidden",
                marginBottom: 16,
                border: `1px solid ${T.rule}`,
              }}
            >
              <img
                src={portraitUrl}
                alt="Suraj Laddagiri"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: T.dim }}>
              Chino, CA → San Diego, CA
            </div>
          </Card>

          <div>
            <p
              style={{
                fontFamily: T.body,
                fontSize: 17,
                lineHeight: 1.7,
                color: T.dim,
                margin: "0 0 28px",
                maxWidth: 640,
              }}
            >
              I&apos;m a senior at UC San Diego with three majors: math and
              computer science, bioengineering, and political science. I&apos;m
              also a certified EMT. Most of what I do is iOS and machine-learning
              work, but the mix of degrees means I like problems that sit between
              software, biology, and policy. I grew up around Los Angeles and I
              live in San Diego now. Outside of work I play a lot of basketball
              and mess around with drones and cars.
            </p>

            {/* education, a clean numbered list, not a glass card */}
            <Rule />
            {majors.map((m, i) => (
              <div key={m.major}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 18,
                    padding: "16px 0",
                  }}
                >
                  <span style={{ fontFamily: T.mono, fontSize: 13, color: T.accent }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontFamily: T.display,
                      fontSize: 18,
                      fontWeight: 500,
                      color: T.ink,
                      flex: 1,
                    }}
                  >
                    {m.major}
                  </span>
                  <span style={{ fontFamily: T.mono, fontSize: 13, color: T.dim }}>
                    {m.degree}
                  </span>
                </div>
                <Rule />
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: "9rem",
            textAlign: "center",
            fontFamily: T.mono,
            fontSize: 12,
            color: T.faint,
          }}
        >
          i need me a job in this economy bro 😭🙏
        </div>
      </section>
    </div>
  );
}
