import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { T, Eyebrow, Rule, SectionHead, Btn, Tag } from "../theme";

/* A single phone screenshot, matte frame, no blue glow, no heavy shadow. */
function Shot({ src, alt, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Zoom ${alt}`}
      style={{
        appearance: "none",
        padding: 0,
        border: `1px solid ${h ? T.ruleStrong : T.rule}`,
        borderRadius: T.radius,
        overflow: "hidden",
        background: T.bg2,
        cursor: "zoom-in",
        width: "100%",
        maxWidth: 200,
        transition: "border-color 160ms ease",
      }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >
      <img src={src} alt={alt} style={{ display: "block", width: "100%", height: "auto" }} />
    </button>
  );
}

/* Key/value stat row with hairline separators, replaces the glass stat cards. */
function Stats({ items }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 0,
        border: `1px solid ${T.rule}`,
        borderRadius: T.radius,
        overflow: "hidden",
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.label}
          style={{
            padding: "16px 18px",
            borderLeft: i === 0 ? "none" : `1px solid ${T.rule}`,
            borderTop: `1px solid transparent`,
          }}
        >
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, marginBottom: 8 }}>
            {it.label}
          </div>
          <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 500, color: T.ink, lineHeight: 1.3 }}>
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectBlock({ p, navigate, onShot }) {
  return (
    <section style={{ marginBottom: 84 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <Eyebrow n={p.index}>{p.eyebrow}</Eyebrow>
        <div style={{ flex: 1, height: 1, background: T.rule }} />
      </div>

      <h2
        style={{
          fontFamily: T.display,
          fontSize: "clamp(30px, 5vw, 52px)",
          fontWeight: 600,
          letterSpacing: "-0.04em",
          lineHeight: 1.0,
          margin: "0 0 18px",
          maxWidth: 760,
        }}
      >
        {p.title}
      </h2>

      <p style={{ fontFamily: T.body, fontSize: 16.5, lineHeight: 1.7, color: T.dim, maxWidth: 720, margin: "0 0 22px" }}>
        {p.blurb}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {p.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <Stats items={p.stats} />
      </div>

      {p.shots && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          {p.shots.map((s) => (
            <Shot key={s.alt} src={s.src} alt={s.alt} onClick={() => onShot(s)} />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {p.links.map((l) =>
          l.href ? (
            <Btn key={l.label} href={l.href} download={l.download} target={l.href.startsWith("http") ? "_blank" : undefined} variant={l.primary ? "solid" : "ghost"}>
              {l.label}
            </Btn>
          ) : (
            <Btn key={l.label} onClick={() => navigate(l.to)} variant={l.primary ? "solid" : "ghost"}>
              {l.label}
            </Btn>
          )
        )}
      </div>
    </section>
  );
}

export default function Portfolio() {
  const navigate = useNavigate();
  const [shot, setShot] = useState(null);
  const baseUrl = import.meta.env.BASE_URL || "/";

  useEffect(() => {
    if (!shot) return undefined;
    const prev = document.body.style.overflow;
    const onKey = (e) => e.key === "Escape" && setShot(null);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [shot]);

  const projects = useMemo(
    () => [
      {
        index: "01",
        eyebrow: "iOS · ESP32 · Bluetooth",
        title: "Music Strip",
        blurb:
          "A Bluetooth-controlled LED strip. The lights are WS2812B LEDs driven by an ESP32, and an iOS app controls them. It can react to music, and it pulls colors from the album art of whatever song is playing.",
        tags: ["Bluetooth", "WS2812B", "ESP32", "Album-art sync", "Animations", "Swift"],
        stats: [
          { label: "Platform", value: "iOS + ESP32" },
          { label: "Protocol", value: "Bluetooth" },
          { label: "Lighting", value: "WS2812B LEDs" },
          { label: "Focus", value: "Music-reactive" },
        ],
        shots: [
          { src: `${baseUrl}IMG_1841.PNG`, alt: "Music Strip animations screen" },
          { src: `${baseUrl}IMG_1844.PNG`, alt: "Music Strip controls screen" },
          { src: `${baseUrl}IMG_1843.PNG`, alt: "Music Strip music sync screen" },
        ],
        links: [
          { label: "App Store", href: "https://apps.apple.com/us/app/music-strip/id6761938199", primary: true },
          { label: "Details", to: "/musicstrip" },
          { label: "GitHub", href: "https://github.com/surajladdagiri/music-strip" },
          { label: "Privacy", to: "/musicstrip/privacy" },
        ],
      },
      {
        index: "02",
        eyebrow: "UC San Diego Senior Design · 2025",
        title: "HAVEN: Haptics & Vision for Environmental Navigation",
        blurb:
          "A head-mounted device that helps blind and low-vision people get around. It uses the phone's camera and LiDAR to spot obstacles, then guides the wearer with five small vibrating motors. Nothing leaves the device; it all runs locally over Bluetooth. I was the software lead. I wrote the iOS app and the Core Bluetooth code that runs the motors.",
        tags: ["Core Bluetooth", "ARKit SLAM", "LiDAR", "On-device", "5 tactors", "Real-time"],
        stats: [
          { label: "Devices", value: "iPhone Pro + Arduino Uno R4" },
          { label: "Sensors", value: "Camera · LiDAR · IMU" },
          { label: "Output", value: "5 haptic tactors" },
          { label: "Path refresh", value: "~0.86 s" },
        ],
        links: [
          { label: "App Store", href: "https://apps.apple.com/us/app/haven-app/id6761937548", primary: true },
          { label: "Details", to: "/haven" },
          { label: "GitHub", href: "https://github.com/surajladdagiri/HAVEN/tree/cloud" },
          { label: "Arduino code", href: `${baseUrl}haven_uno_r4_haptics.ino`, download: true },
          { label: "Python viewer", href: `${baseUrl}haven_viewer_v3.py`, download: true },
          { label: "Privacy", to: "/haven/privacy" },
        ],
      },
      {
        index: "03",
        eyebrow: "Machine Learning · UCSD CSE 151A",
        title: "Congressional Vote Prediction",
        blurb:
          "A model that predicts how each of the 535 members of Congress will vote on a bill, using the bill's text and metadata. It embeds the bill text with DistilBERT, adds one-hot features, and runs everything through 535 separate neural networks, one per member. Mean accuracy is 86.4%. A Flask app serves the predictions live. I built the model, trained it, and wrote the web interface.",
        tags: ["DistilBERT", "PyTorch", "NLP embeddings", "535 models", "Flask + SocketIO", "TF-IDF baseline"],
        stats: [
          { label: "Model", value: "DistilBERT + NN" },
          { label: "Scale", value: "535 per-member nets" },
          { label: "Accuracy", value: "86.4% mean" },
          { label: "Serving", value: "Flask · real-time" },
        ],
        links: [
          { label: "Case study", to: "/congress", primary: true },
          { label: "GitHub", href: "https://github.com/therab6it/UCSD_CSE151A-SS1/tree/Milestone-4" },
        ],
      },
      {
        index: "04",
        eyebrow: "Jailbreak tweak · Theos + Logos",
        title: "IGAdBlock",
        blurb:
          "A MobileSubstrate tweak that hooks Instagram's feed data sources at runtime. It removes ads, Threads suggestions, and the TestFlight nag screen from the feed data before the app can show them. I found which classes to hook by reverse-engineering Instagram's feed code with FLEX.",
        tags: ["Runtime hooking", "FLEX RE", "arm64 / arm64e", "Swift class resolution", "GitHub Actions CI"],
        stats: [
          { label: "Platform", value: "Jailbroken iOS 15+" },
          { label: "Toolchain", value: "Theos + Logos" },
          { label: "Binary", value: "Universal arm64e" },
          { label: "Release", value: "GitHub Releases" },
        ],
        links: [
          { label: "GitHub", href: "https://github.com/surajladdagiri/IGAdBlock", primary: true },
          { label: "Details", to: "/igadblock" },
        ],
      },
    ],
    [baseUrl]
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <div style={{ maxWidth: T.maxW, margin: "0 auto", padding: "56px 24px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <Eyebrow n="00">Selected work</Eyebrow>
          <div style={{ flex: 1, height: 1, background: T.rule }} />
        </div>
        <h1 style={{ fontFamily: T.display, fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
          Things I&apos;ve built
        </h1>
        <p style={{ fontFamily: T.body, fontSize: 16, color: T.dim, maxWidth: 620, margin: "0 0 64px" }}>
          A few things I&apos;ve built. Some are iOS apps, one is hardware, one
          is a machine-learning project. I worked on each of them from the first
          idea to a version people can actually use.
        </p>

        {projects.map((p) => (
          <ProjectBlock key={p.title} p={p} navigate={navigate} onShot={setShot} />
        ))}

      </div>

      {shot && (
        <div
          onClick={() => setShot(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1400,
            background: "rgba(8,8,9,0.94)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1.25rem",
          }}
        >
          <button
            type="button"
            onClick={() => setShot(null)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 22,
              right: 22,
              width: 42,
              height: 42,
              borderRadius: T.radius,
              border: `1px solid ${T.rule}`,
              background: "transparent",
              color: T.ink,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ×
          </button>
          <img
            src={shot.src}
            alt={shot.alt}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "92vw",
              maxHeight: "84vh",
              width: "auto",
              borderRadius: T.radius,
              border: `1px solid ${T.rule}`,
              background: T.bg2,
            }}
          />
        </div>
      )}
    </div>
  );
}
