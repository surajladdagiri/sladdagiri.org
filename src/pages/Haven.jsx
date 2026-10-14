import { useNavigate } from "react-router-dom";
import { T, Eyebrow, Rule, Btn, Tag } from "../theme";
import Breadcrumbs from "../Breadcrumbs";
import PhoneShowcase from "../PhoneShowcase";

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
  { label: "Devices", value: "iPhone Pro + Arduino Uno R4" },
  { label: "Sensors", value: "Camera · LiDAR · IMU" },
  { label: "Output", value: "5 haptic tactors" },
  { label: "Path refresh", value: "~0.86 s" },
];

const PHASES = [
  { k: "Sense", t: "See the space", d: "A LiDAR iPhone, worn on the head, captures camera, depth, and motion data. From that it builds a live picture of what is ahead." },
  { k: "Plan", t: "Find a path", d: "The navigation code tries to go in a straight line. When something is in the way it switches to A*. It re-plans around moving obstacles about every 0.86 seconds." },
  { k: "Guide", t: "Steer with touch", d: "Five small motors turn heading corrections into directional buzzes. The commands go to the Arduino over Core Bluetooth, and it all runs on-device." },
  { k: "Test", t: "The prototype", d: "The prototype works, and it's good at not missing obstacles. All the sensor data stays on the phone." },
];

export default function Haven() {
  const navigate = useNavigate();
  const baseUrl = import.meta.env.BASE_URL || "/";

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 110px" }}>
        <Breadcrumbs trail={[{ label: "Home", to: "/" }, { label: "Work", to: "/portfolio" }, { label: "HAVEN" }]} />

        <Eyebrow n="◦" style={{ marginBottom: 18 }}>UC San Diego Senior Design · 2025</Eyebrow>
        <h1 style={{ fontFamily: T.display, fontSize: "clamp(34px,6vw,62px)", fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 0.98, margin: "0 0 22px" }}>
          HAVEN: Haptics &amp; Vision for Environmental Navigation
        </h1>
        <P>
          A head-mounted device that helps blind and low-vision people move
          through places they do not know. It uses the phone&apos;s camera and LiDAR to map what&apos;s ahead, then steers the wearer around obstacles with five small vibrating motors. None of the sensor data
          leaves the device. I was the software lead. I wrote the iOS app and the
          Core Bluetooth code that runs the motors in real time.
        </P>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "22px 0 26px" }}>
          {["Core Bluetooth", "ARKit SLAM", "LiDAR", "On-device", "5 tactors", "A* planning", "Real-time"].map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 30 }}>
          <Btn href="https://apps.apple.com/us/app/haven-app/id6761937548" target="_blank" variant="solid">App Store</Btn>
          <Btn href="https://github.com/surajladdagiri/HAVEN/tree/cloud" target="_blank">GitHub</Btn>
          <Btn href={`${baseUrl}haven_uno_r4_haptics.ino`} download>Arduino code</Btn>
          <Btn href={`${baseUrl}haven_viewer_v3.py`} download>Python viewer</Btn>
          <Btn onClick={() => navigate("/haven/privacy")}>Privacy</Btn>
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
        <p style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, margin: "0 0 4px" }}>
          Scroll to flip through the screens.
        </p>
        <PhoneShowcase
          screenshots={[`${baseUrl}h_1.PNG`, `${baseUrl}h_2.PNG`, `${baseUrl}h_3.PNG`]}
        />

        <H index="02" label="The problem">Why we built it</H>
        <P>
          Most navigation aids for blind users work through audio. The problem is
          that audio competes with hearing, which is the sense those users depend
          on most to stay aware of what is around them. HAVEN uses touch, which leaves the ears free. It also does the sensing with a phone that
          many people already own.
        </P>

        <H index="03" label="How it works">The steps</H>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginTop: 6 }}>
          {PHASES.map((p) => (
            <div key={p.k} style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: 18, background: T.surface }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.accent, marginBottom: 10 }}>{p.k}</div>
              <div style={{ fontFamily: T.display, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{p.t}</div>
              <div style={{ fontFamily: T.body, fontSize: 14, lineHeight: 1.6, color: T.dim }}>{p.d}</div>
            </div>
          ))}
        </div>

        <H index="04" label="My role">What I did</H>
        <P>
          I wrote all the software. That is the iOS app and the Core Bluetooth
          code that connects the phone to the wearable and keeps the link fast
          and stable. I also wrote the part that turns the phone&apos;s live
          heading into vibration strength for each motor, so the feeling shifts smoothly as you turn your head.
        </P>
        <P>
          The hardest part was tuning that mapping so the buzzing makes sense without any training. You should just feel &quot;go that way.&quot; Someone is trusting this thing to get around, so everything runs on the phone, where a bad connection can&apos;t break it. Dr. Gert Cauwenberghs advised the project.
        </P>

        <div style={{ marginTop: 48 }}>
          <Rule />
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, marginTop: 20 }}>
            Head-mounted prototype · streams local-only over Bluetooth
          </p>
        </div>
      </div>
    </div>
  );
}
