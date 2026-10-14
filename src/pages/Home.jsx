import { useNavigate } from "react-router-dom";
import { T } from "../theme";
import Hero3D from "../Hero3D";
import Reveal from "../Reveal";

/* Home — rebuilt from scratch around the 3D. A single full-viewport, always-
   moving 3D scene fills the hero (no empty scroll void), then the page moves
   straight into real content: a Selected Work grid and an About block. Warm
   duotone palette, kept local so the rest of the site is untouched. */

const C = {
  bg: "#0a0a0f",
  ink: "#f6f3ec",
  dim: "rgba(246,243,236,0.64)",
  faint: "rgba(246,243,236,0.42)",
  line: "rgba(246,243,236,0.14)",
  lineSoft: "rgba(246,243,236,0.08)",
  card: "rgba(255,255,255,0.02)",
  accent: "#ff6b35",
  accent2: "#ffc93c",
};

const PROJECTS = [
  {
    title: "HAVEN",
    path: "/haven",
    blurb:
      "A head-mounted navigation aid for blind and low-vision users. The phone's LiDAR maps what's ahead, and five small motors buzz to steer you around it. Nothing goes to the cloud.",
    tags: ["iOS", "Bluetooth", "Hardware"],
  },
  {
    title: "SLEAP iOS",
    path: "/sleap-ios",
    blurb:
      "Animal pose estimation that runs entirely on an iPhone. A model I trained with SLEAP finds each fly in a video and draws a 13-point skeleton on it at up to 17 FPS.",
    tags: ["iOS", "On-device ML", "Core ML"],
  },
  {
    title: "Music Strip",
    path: "/musicstrip",
    blurb:
      "An LED strip on an ESP32 that you control from an iPhone over Bluetooth. It can move with the music or take its colors from the album art of whatever's playing.",
    tags: ["iOS", "ESP32", "Bluetooth"],
  },
  {
    title: "Congressional Vote Prediction",
    path: "/congress",
    blurb:
      "Predicts how each of the 535 members of Congress will vote on a bill. Every member gets their own small network on top of DistilBERT embeddings of the bill text; mean accuracy was 86.4%.",
    tags: ["Machine learning", "NLP"],
  },
];

const FACTS = [
  ["2", "apps on the App Store"],
  ["3", "majors at UC San Diego"],
  ["EMT", "certified"],
];

function Btn({ children, onClick, href, solid }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontFamily: T.mono,
    fontSize: 13,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    padding: "12px 20px",
    borderRadius: 2,
    cursor: "pointer",
    textDecoration: "none",
    transition: "transform 160ms ease, border-color 160ms ease, color 160ms ease",
    border: `1px solid ${solid ? C.accent : C.line}`,
    background: solid ? C.accent : "transparent",
    color: solid ? "#160a04" : C.ink,
    fontWeight: solid ? 700 : 500,
  };
  const enter = (e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    if (!solid) e.currentTarget.style.borderColor = C.accent2;
  };
  const leave = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    if (!solid) e.currentTarget.style.borderColor = C.line;
  };
  if (href)
    return (
      <a href={href} target="_blank" rel="noreferrer" style={base} onMouseEnter={enter} onMouseLeave={leave}>
        {children}
      </a>
    );
  return (
    <button onClick={onClick} style={base} onMouseEnter={enter} onMouseLeave={leave}>
      {children}
    </button>
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
        width: 46,
        height: 46,
        borderRadius: 2,
        color: C.ink,
        border: `1px solid ${C.line}`,
        transition: "border-color 160ms ease, color 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.accent2;
        e.currentTarget.style.color = C.accent2;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.line;
        e.currentTarget.style.color = C.ink;
      }}
    >
      {children}
    </a>
  );
}

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A2.03 2.03 0 0 0 3.2 5.02c0 1.11.9 2.02 2.02 2.02h.03a2.02 2.02 0 1 0 0-4.04ZM20.44 12.42c0-3.46-1.85-5.07-4.32-5.07-1.99 0-2.88 1.1-3.38 1.87V8.5H9.37c.04.48 0 11.5 0 11.5h3.37v-6.42c0-.34.02-.68.13-.92.27-.68.89-1.39 1.93-1.39 1.36 0 1.9 1.04 1.9 2.57V20h3.37v-7.58Z" />
  </svg>
);
const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.2-3.37-1.2-.46-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.72 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.7.12 2.5.35 1.9-1.32 2.74-1.05 2.74-1.05.56 1.42.21 2.46.11 2.72.64.72 1.02 1.63 1.02 2.75 0 3.95-2.34 4.82-4.58 5.08.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.84 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z" />
  </svg>
);

function ProjectCard({ p, navigate }) {
  return (
    <button
      onClick={() => navigate(p.path)}
      style={{
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 6,
        padding: "24px 24px 22px",
        color: C.ink,
        transition: "transform 180ms ease, border-color 180ms ease, background 180ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.borderColor = C.accent;
        e.currentTarget.style.background = "rgba(255,107,53,0.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = C.line;
        e.currentTarget.style.background = C.card;
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {p.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontFamily: T.mono,
              fontSize: 11,
              letterSpacing: "0.03em",
              color: C.accent2,
              border: `1px solid ${C.line}`,
              borderRadius: 999,
              padding: "3px 10px",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      <h3 style={{ fontFamily: T.display, fontSize: 23, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 10px", lineHeight: 1.15 }}>
        {p.title}
      </h3>
      <p style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.6, color: C.dim, margin: "0 0 20px" }}>
        {p.blurb}
      </p>
      <span style={{ marginTop: "auto", fontFamily: T.mono, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: C.accent }}>
        View project
      </span>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const portraitUrl = `${import.meta.env.BASE_URL || "/"}IMG_8647.jpeg`;
  const resumeUrl = `${import.meta.env.BASE_URL || "/"}Suraj_Laddagiri_Resume.pdf`;
  const majors = [
    {
      major: "Bioengineering: Biotechnology",
      degree: "B.S.",
      courses: [
        { code: "BENG 100", title: "Intro to Probability & Statistics for Bioengineers" },
        { code: "BENG 103B", title: "Bioengineering Mass Transfer" },
        { code: "BENG 123", title: "Dynamic Simulation in Bioengineering" },
        { code: "BENG 125", title: "Modeling & Computation in Bioengineering" },
        { code: "BENG 130", title: "Biotechnology Thermodynamics & Kinetics" },
        { code: "BENG 160", title: "Chemical & Molecular Bioengineering Techniques" },
        { code: "BENG 161A", title: "Bioreactor Engineering" },
        { code: "BENG 161B", title: "Biochemical Engineering" },
        { code: "BENG 162", title: "Biotechnology Laboratory" },
        { code: "BENG 166A", title: "Cell and Tissue Engineering" },
        { code: "BENG 168", title: "Biomolecular Engineering" },
        { code: "BENG 186A", title: "Principles of Biomaterials Design" },
        { code: "BICD 100", title: "Genetics" },
        { code: "CENG 101A", title: "Introductory Fluid Mechanics" },
        { code: "MAE 170", title: "Experimental Techniques" },
        { code: "BENG 202", title: "Bioinformatics II: Bioinformatics Algorithms", grad: true },
        { code: "BENG 221", title: "Mathematical Methods for Bioengineering", grad: true },
      ],
    },
    {
      major: "Mathematics–Computer Science",
      degree: "B.S.",
      courses: [
        { code: "CSE 100", title: "Advanced Data Structures" },
        { code: "CSE 101", title: "Design and Analysis of Algorithms" },
        { code: "CSE 105", title: "Theory of Computation" },
        { code: "CSE 140", title: "Components and Design Techniques for Digital Systems" },
        { code: "CSE 151A", title: "Machine Learning: Learning Algorithms" },
        { code: "CSE 152A", title: "Introduction to Computer Vision I" },
        { code: "CSE 156", title: "Statistical Natural Language Processing" },
        { code: "CSE 182", title: "Biological Databases" },
        { code: "MATH 109", title: "Mathematical Reasoning" },
        { code: "MATH 103A", title: "Modern Algebra I" },
        { code: "MATH 103B", title: "Modern Algebra II" },
        { code: "MATH 170A", title: "Introduction to Numerical Analysis: Linear Algebra" },
        { code: "MATH 183", title: "Statistical Methods" },
        { code: "MATH 184", title: "Enumerative Combinatorics" },
        { code: "MATH 194", title: "The Mathematics of Finance" },
        { code: "CSE 282", title: "Bioinformatics II: Sequence and Structure Analysis", grad: true },
      ],
    },
    {
      major: "Political Science",
      degree: "B.A.",
      courses: [
        { code: "POLI 100B", title: "The U.S. Congress" },
        { code: "POLI 100G", title: "How to Win or Lose an Election" },
        { code: "POLI 100W", title: "Politics, Policy, and Education Inequality" },
        { code: "POLI 101A", title: "Black Politics in the U.S." },
        { code: "POLI 113BR", title: "Chinese and Japanese Political Thought I" },
        { code: "POLI 114BR", title: "Marxist Political Thought" },
        { code: "POLI 117R", title: "Bending the Curve: Solutions to Climate Change" },
        { code: "POLI 131CR", title: "The Chinese Revolution" },
        { code: "POLI 145", title: "Theories, Technology, and National Security" },
        { code: "POLI 149", title: "Spies, Intelligence, and US National Security" },
        { code: "POLI 150A", title: "Politics of Immigration" },
        { code: "POLI 153", title: "The European Union in World Politics" },
      ],
    },
  ];

  return (
    <div style={{ background: C.bg, color: C.ink, position: "relative" }}>
      {/* warm wash so no section is ever flat black (scoped to Home, so it
          never paints over the site footer that Layout renders below) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(120% 80% at 80% 0%, rgba(255,107,53,0.10) 0%, transparent 45%), radial-gradient(90% 70% at 0% 100%, rgba(255,201,60,0.06) 0%, transparent 50%), #0a0a0f",
        }}
      />

      {/* ---- hero: one full screen, the 3D fills it edge to edge ---- */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          overflow: "hidden",
        }}
      >
        <Hero3D colorA={C.accent} colorB={C.accent2} />

        {/* legibility scrim, weighted to the left where the copy sits */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(90deg, rgba(10,10,15,0.82) 0%, rgba(10,10,15,0.42) 45%, transparent 72%), linear-gradient(0deg, rgba(10,10,15,0.55) 0%, transparent 26%)",
          }}
        />

        <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: T.maxW, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: C.accent2,
              marginBottom: 22,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ width: 26, height: 1, background: C.accent }} />
            iOS &amp; ML engineer · UC San Diego
          </div>

          <h1
            style={{
              fontFamily: T.display,
              fontSize: "clamp(48px, 9vw, 112px)",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 0.9,
              margin: 0,
            }}
          >
            Suraj
            <br />
            Laddagiri
          </h1>

          <p
            style={{
              fontFamily: T.body,
              fontSize: "clamp(16px, 2vw, 20px)",
              color: C.dim,
              lineHeight: 1.6,
              maxWidth: 520,
              margin: "28px 0 34px",
            }}
          >
            Mostly I write iOS apps. Some of them talk to Bluetooth hardware I built, and lately a couple run machine-learning models right on the phone. I graduate from UC San Diego in September 2026.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 44 }}>
            <Btn href={resumeUrl} solid>
              Resume
            </Btn>
            <Btn onClick={() => navigate("/portfolio")}>Work</Btn>
            <Btn onClick={() => navigate("/demos")}>Demos</Btn>
            <Social href="https://www.linkedin.com/in/suraj-laddagiri-903602272/" label="LinkedIn">
              <LinkedInIcon />
            </Social>
            <Social href="https://github.com/surajladdagiri" label="GitHub">
              <GitHubIcon />
            </Social>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 40px" }}>
            {FACTS.map(([big, small]) => (
              <div key={small} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontFamily: T.display, fontSize: 30, fontWeight: 600, color: C.accent }}>{big}</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: "0.04em", color: C.faint, maxWidth: 120 }}>
                  {small}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            fontFamily: T.mono,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.faint,
            zIndex: 2,
          }}
        >
          Selected work below
        </div>
      </section>

      {/* ---- selected work ---- */}
      <section style={{ position: "relative", zIndex: 1, padding: "40px 24px 40px" }}>
        <div style={{ maxWidth: T.maxW, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 34, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: C.accent2, marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: C.accent }}>01</span>
                  <span style={{ width: 26, height: 1, background: C.line }} />
                  Selected work
                </div>
                <h2 style={{ fontFamily: T.display, fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>
                  Things I&apos;ve shipped.
                </h2>
              </div>
              <Btn onClick={() => navigate("/portfolio")}>All work</Btn>
            </div>
          </Reveal>

          <style>{`
            .home-work-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
            @media (max-width: 720px) { .home-work-grid { grid-template-columns: 1fr; } }
          `}</style>
          <div className="home-work-grid">
            {PROJECTS.map((p, i) => (
              <Reveal key={p.path} y={18} delay={i * 60}>
                <ProjectCard p={p} navigate={navigate} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- about ---- */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 24px 120px" }}>
        <div style={{ maxWidth: T.maxW, margin: "0 auto" }}>
          <style>{`
            @media (max-width: 720px) {
              .home-about-grid { grid-template-columns: 1fr !important; }
              .home-about-grid .portrait { max-width: 340px; }
            }
            .major-acc { border-bottom: 1px solid ${C.line}; }
            .major-acc > summary {
              list-style: none;
              cursor: pointer;
              display: flex;
              align-items: baseline;
              gap: 16px;
              padding: 18px 0;
              outline: none;
            }
            .major-acc > summary::-webkit-details-marker { display: none; }
            .major-acc > summary:hover span:nth-child(2) { color: ${C.accent2}; }
            .major-acc .chev { align-self: center; transition: transform 220ms ease; flex-shrink: 0; }
            .major-acc[open] .chev { transform: rotate(180deg); }
            .major-panel { padding: 2px 0 18px 34px; display: flex; flex-direction: column; }
            .major-acc .course-row {
              display: flex; align-items: baseline; gap: 14px; padding: 7px 0;
            }
            @media (max-width: 560px) {
              .major-acc > summary { flex-wrap: wrap; gap: 8px 14px; }
              .major-panel { padding-left: 0; }
            }
          `}</style>
          <Reveal>
            <div style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: C.accent2, marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: C.accent }}>02</span>
              <span style={{ width: 26, height: 1, background: C.line }} />
              About
            </div>
            <h2 style={{ fontFamily: T.display, fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 44px", maxWidth: 720 }}>
              A bit about me
            </h2>

            <div
              className="home-about-grid"
              style={{ display: "grid", gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)", gap: 40, alignItems: "start" }}
            >
              <div className="portrait">
                <div style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 4, overflow: "hidden", border: `1px solid ${C.line}`, marginBottom: 14 }}>
                  <img src={portraitUrl} alt="Suraj Laddagiri" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: C.faint }}>Chino, CA → San Diego, CA</div>
              </div>

              <div>
                <p style={{ fontFamily: T.body, fontSize: 18, lineHeight: 1.72, color: C.dim, margin: "0 0 36px", maxWidth: 620 }}>
                  I&apos;m a senior at UC San Diego, majoring in math-CS, bioengineering, and political science (yes, all three). I&apos;m also a certified EMT. Most of my time goes into iOS and machine learning, though the bioengineering side keeps pulling me toward health and lab software. I grew up near Los Angeles and live in San Diego now. When I&apos;m not coding I&apos;m usually playing basketball or flying a drone, and I spend more time than I should working on cars.
                </p>

                <div style={{ height: 1, background: C.line }} />
                {majors.map((m, i) => {
                  const gradCount = m.courses.filter((c) => c.grad).length;
                  const ud = m.courses.length - gradCount;
                  return (
                    <details key={m.major} className="major-acc">
                      <summary>
                        <span style={{ fontFamily: T.mono, fontSize: 13, color: C.accent }}>{String(i + 1).padStart(2, "0")}</span>
                        <span style={{ fontFamily: T.display, fontSize: 19, fontWeight: 500, color: C.ink, flex: 1 }}>{m.major}</span>
                        <span style={{ fontFamily: T.mono, fontSize: 12, color: C.faint, whiteSpace: "nowrap" }}>
                          {ud} courses{gradCount ? ` · ${gradCount} grad` : ""}
                        </span>
                        <span style={{ fontFamily: T.mono, fontSize: 13, color: C.dim }}>{m.degree}</span>
                        <svg className="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M6 9l6 6 6-6" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </summary>
                      <div className="major-panel">
                        {m.courses.map((c) => (
                          <div key={c.code} className="course-row">
                            <span style={{ fontFamily: T.mono, fontSize: 12.5, color: C.accent2, minWidth: 92, whiteSpace: "nowrap" }}>{c.code}</span>
                            <span style={{ fontFamily: T.body, fontSize: 14.5, color: C.dim, flex: 1 }}>{c.title}</span>
                            {c.grad && (
                              <span
                                title="Graduate-level course"
                                style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 3, padding: "2px 6px", whiteSpace: "nowrap" }}
                              >
                                Grad
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
