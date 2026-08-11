import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { T, Eyebrow, Rule, Btn, Tag } from "../theme";

function H({ index, label, children }) {
  return (
    <div style={{ marginTop: 56, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <Eyebrow n={index}>{label}</Eyebrow>
        <div style={{ flex: 1, height: 1, background: T.rule }} />
      </div>
      <h2 style={{ fontFamily: T.display, fontSize: "clamp(24px,3.4vw,34px)", fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>
        {children}
      </h2>
    </div>
  );
}
function P({ children }) {
  return <p style={{ fontFamily: T.body, fontSize: 16, lineHeight: 1.72, color: T.dim, maxWidth: 720, margin: "0 0 16px" }}>{children}</p>;
}

const STATS = [
  { label: "Platform", value: "iOS + ESP32" },
  { label: "Protocol", value: "Bluetooth" },
  { label: "Lighting", value: "WS2812B LEDs" },
  { label: "Focus", value: "Music-reactive" },
];

const FEATURES = [
  ["Bluetooth control", "Control the strip from your phone over a BLE link to the ESP32."],
  ["Album-art color", "The app reads the artwork of the current song and matches the strip's colors to it."],
  ["Animations", "Several lighting animations, with brightness and speed you can adjust."],
  ["Music-reactive", "The lights move in time with the music that is playing."],
];

export default function MusicStrip() {
  const navigate = useNavigate();
  const baseUrl = import.meta.env.BASE_URL || "/";
  const [shot, setShot] = useState(null);

  const shots = [
    { src: `${baseUrl}IMG_1841.PNG`, alt: "Animations screen" },
    { src: `${baseUrl}IMG_1844.PNG`, alt: "Controls screen" },
    { src: `${baseUrl}IMG_1843.PNG`, alt: "Music sync screen" },
  ];

  useEffect(() => {
    if (!shot) return undefined;
    const prev = document.body.style.overflow;
    const onKey = (e) => e.key === "Escape" && setShot(null);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [shot]);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 110px" }}>
        <button onClick={() => navigate("/portfolio")} style={{ border: "none", background: "transparent", color: T.dim, fontFamily: T.mono, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 30 }}>
          ← Work
        </button>

        <Eyebrow n="◦" style={{ marginBottom: 18 }}>iOS · ESP32 · Bluetooth</Eyebrow>
        <h1 style={{ fontFamily: T.display, fontSize: "clamp(36px,6vw,66px)", fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 0.98, margin: "0 0 22px" }}>
          Music Strip
        </h1>
        <P>
          A Bluetooth-controlled LED strip. The lights are WS2812B LEDs on an
          ESP32, and an iOS app controls them. You get manual controls and a set
          of animations. The app can also read the album art of the song
          you&apos;re playing and light the strip in those colors.
        </P>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "22px 0 26px" }}>
          {["Bluetooth", "WS2812B", "ESP32", "Album-art sync", "Animations", "Swift"].map((t) => <Tag key={t}>{t}</Tag>)}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 30 }}>
          <Btn href="https://apps.apple.com/us/app/music-strip/id6761938199" target="_blank" variant="solid">App Store</Btn>
          <Btn href="https://github.com/surajladdagiri/music-strip" target="_blank">GitHub</Btn>
          <Btn onClick={() => navigate("/musicstrip/privacy")}>Privacy</Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ padding: "16px 18px", borderLeft: i === 0 ? "none" : `1px solid ${T.rule}` }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 500 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <H index="01" label="Screens">A look at the app</H>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {shots.map((s) => (
            <button key={s.alt} type="button" onClick={() => setShot(s)} aria-label={`Zoom ${s.alt}`}
              style={{ appearance: "none", padding: 0, border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden", background: T.bg2, cursor: "zoom-in", width: "100%", maxWidth: 200 }}>
              <img src={s.src} alt={s.alt} style={{ display: "block", width: "100%", height: "auto" }} />
            </button>
          ))}
        </div>

        <H index="02" label="Features">What it does</H>
        <div style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
          {FEATURES.map((f, i) => (
            <div key={f[0]} style={{ display: "grid", gridTemplateColumns: "minmax(140px,200px) 1fr", gap: 16, padding: "16px 18px", borderTop: i === 0 ? "none" : `1px solid ${T.rule}` }}>
              <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 600 }}>{f[0]}</div>
              <div style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.6, color: T.dim }}>{f[1]}</div>
            </div>
          ))}
        </div>

        <H index="03" label="Build">How it&apos;s built</H>
        <P>
          The strip is a chain of addressable WS2812B LEDs on an ESP32. The ESP32
          holds the Bluetooth connection and runs the lighting modes. The iOS app
          is the remote. It reads the current song, picks colors from the album
          art, and sends the state to the ESP32 over BLE. One tap on the phone
          can set a plain color, an animation, or the music-reactive mode.
        </P>

        <div style={{ marginTop: 48 }}>
          <Rule />
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, marginTop: 20 }}>
            Live on the App Store
          </p>
        </div>
      </div>

      {shot && (
        <div onClick={() => setShot(null)} style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(8,8,9,0.94)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
          <button type="button" onClick={() => setShot(null)} aria-label="Close" style={{ position: "absolute", top: 22, right: 22, width: 42, height: 42, borderRadius: T.radius, border: `1px solid ${T.rule}`, background: "transparent", color: T.ink, fontSize: 20, cursor: "pointer" }}>×</button>
          <img src={shot.src} alt={shot.alt} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "92vw", maxHeight: "84vh", width: "auto", borderRadius: T.radius, border: `1px solid ${T.rule}`, background: T.bg2 }} />
        </div>
      )}
    </div>
  );
}
