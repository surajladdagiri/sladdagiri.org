import { T, Eyebrow, Rule, Btn, Tag } from "../theme";
import Breadcrumbs from "../Breadcrumbs";
import PhoneShowcase from "../PhoneShowcase";
import Reveal from "../Reveal";
import { SLEAP_SHOTS, SLEAP_REPO, SLEAP_TESTFLIGHT, SLEAP_NOTEBOOK } from "../data/sleap";

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
function Code({ children }) {
  return <code style={{ fontFamily: T.mono, fontSize: 13.5, color: T.accent2 }}>{children}</code>;
}

function Table({ head, rows, note }) {
  return (
    <div>
      <div style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${head.length}, minmax(0, 1fr))`, background: T.bg2 }}>
          {head.map((h) => (
            <div key={h} style={{ padding: "12px 16px", fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim }}>{h}</div>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${head.length}, minmax(0, 1fr))`, borderTop: `1px solid ${T.rule}` }}>
            {r.map((c, j) => (
              <div key={j} style={{ padding: "13px 16px", fontFamily: j === 0 ? T.display : T.mono, fontSize: j === 0 ? 15 : 14, color: j === 0 ? T.ink : T.accent2 }}>{c}</div>
            ))}
          </div>
        ))}
      </div>
      {note && <p style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, margin: "10px 0 0", maxWidth: 720 }}>{note}</p>}
    </div>
  );
}

const STATS = [
  { label: "Model", value: "Two-stage top-down U-Net" },
  { label: "Input", value: "1024 × 1024 grayscale" },
  { label: "Output", value: "13 keypoints · up to 2 flies" },
  { label: "Peak speed", value: "17 FPS · iPhone 15 Pro Max" },
];

const PIPELINE = [
  { k: "Frame", d: "An image, or a video frame pulled with AVFoundation." },
  { k: "Preprocess", d: "Convert to a 1024 × 1024 grayscale tensor." },
  { k: "Centroid", d: "Stage one finds each fly by its thorax at half scale." },
  { k: "Instance", d: "Stage two predicts body parts inside a 160 × 160 crop per fly." },
  { k: "Decode", d: "Turn the output into 13 keypoint coordinates per fly." },
  { k: "Render", d: "Draw the skeleton with Core Graphics and show it in SwiftUI." },
];

const MODES = [
  ["Renderer Test", "Draws saved predictions over the reference image so the Swift renderer can be checked against the Python overlay pixel for pixel."],
  ["Prediction Test", "Runs the bundled model on the reference image on the device and renders what it finds."],
  ["Video Test", "Processes the bundled clip frame by frame, with overlays, a live FPS counter, and stop and reset controls."],
];

export default function SleapIOS() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 110px" }}>
        <Breadcrumbs trail={[{ label: "Home", to: "/" }, { label: "Work", to: "/portfolio" }, { label: "SLEAP iOS" }]} />

        <Eyebrow n="◦" style={{ marginBottom: 18 }}>iOS · On-device ML · SLEAP</Eyebrow>
        <h1 style={{ fontFamily: T.display, fontSize: "clamp(36px,6vw,66px)", fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 0.98, margin: "0 0 22px" }}>
          SLEAP iOS
        </h1>
        <P>
          Animal pose estimation that runs entirely on iPhone and iPad. The
          app runs a fly pose model trained with SLEAP, the pose-tracking tool
          from Talmo Lab, on the device through ONNX Runtime with Core ML
          acceleration. It finds each fly in a frame and marks 13 body parts on it. The skeleton is drawn over still images or video in real time.
        </P>
        <P>
          I did both halves. I trained and exported the model in Python with SLEAP-NN, then wrote the Swift side: getting frames ready, running the model, decoding what comes out, and drawing it.
        </P>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "22px 0 26px" }}>
          {["SwiftUI", "ONNX Runtime 1.24", "Core ML EP", "SLEAP-NN", "PyTorch", "AVFoundation", "Swift actors", "GitHub Actions"].map((t) => <Tag key={t}>{t}</Tag>)}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 30 }}>
          <Btn href={SLEAP_TESTFLIGHT} target="_blank" variant="solid">TestFlight</Btn>
          <Btn href={SLEAP_REPO} target="_blank">GitHub</Btn>
          <Btn href={SLEAP_NOTEBOOK} target="_blank">Training notebook</Btn>
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
        <PhoneShowcase screenshots={SLEAP_SHOTS.map((s) => s.src)} captions={SLEAP_SHOTS.map((s) => s.caption)} />

        <H index="02" label="Pipeline">From frame to skeleton</H>
        <P>
          The bundled model is top-down: first find the animals, then look
          closely at each one. In the app, getting frames ready and drawing the results are kept apart from inference, which sits behind an actor-based{" "}
          <Code>PoseEstimator</Code> protocol. A different backend could slot in later and nothing else would have to change.
        </P>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 8 }}>
          {PIPELINE.map((s, i) => (
            <Reveal key={s.k} y={14} delay={i * 50}>
              <div style={{ height: "100%", border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "16px 18px", background: T.surface }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 12, color: T.accent }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontFamily: T.display, fontSize: 16.5, fontWeight: 600 }}>{s.k}</span>
                </div>
                <div style={{ fontFamily: T.body, fontSize: 14, lineHeight: 1.6, color: T.dim }}>{s.d}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <H index="03" label="Training">Training and export</H>
        <P>
          The model is trained on the flies13 dataset: 1024 × 1024 grayscale
          frames with two flies and 13 labeled body parts each. Both stages use
          U-Net backbones with a 1e-4 learning rate and full ±180° rotation
          augmentation. The Jupyter notebook started from the official SLEAP-NN example. It goes from downloading the data through training, evaluation, and ONNX export, and it also writes out a reference image and predictions so I could check the iOS renderer against Python.
        </P>
        <P>
          One export detail needed a workaround. The ONNX graph reports which
          detections are valid with a Boolean tensor, and the Objective-C/Swift
          ONNX Runtime bindings could not inspect Boolean outputs. The fix was a
          final notebook step that adds an ONNX <Code>Cast</Code> so the model outputs{" "}
          <Code>instance_valid_int32</Code>, an integer copy of the same mask. The weights and the meaning
          of the mask stay the same, and the app reads it without trouble.
        </P>
        <div style={{ marginTop: 8 }}>
          <Table
            head={["Metric", "Value"]}
            rows={[
              ["OKS mAP", "0.3987"],
              ["mPCK", "0.6949"],
              ["Median keypoint error", "2.57 px"],
              ["90th-percentile error", "6.86 px"],
            ]}
            note="Measured in Python on the held-out test set."
          />
        </div>

        <H index="04" label="Performance">Speed on device</H>
        <Table
          head={["Device", "OS", "Peak FPS"]}
          rows={[
            ["iPhone 15 Pro Max", "iOS 27.0", "17"],
            ["iPad Pro 11-inch (M1)", "iPadOS 27.0", "14"],
          ]}
          note="The counter times the whole loop, from converting the frame to drawing the overlay, so it measures how fast the app processes video."
        />

        <H index="05" label="App">Three ways to test it</H>
        <div style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
          {MODES.map((m, i) => (
            <div key={m[0]} style={{ display: "grid", gridTemplateColumns: "minmax(140px,200px) 1fr", gap: 16, padding: "16px 18px", borderTop: i === 0 ? "none" : `1px solid ${T.rule}` }}>
              <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 600 }}>{m[0]}</div>
              <div style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.6, color: T.dim }}>{m[1]}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 16 }} />
        <P>
          A GitHub Actions workflow builds an unsigned IPA for every release, so
          the app can be sideloaded with a personal Apple account. TestFlight is
          the simpler route.
        </P>

        <H index="06" label="Scope">What it doesn&apos;t do yet</H>
        <P>
          Each frame is predicted on its own. There is no identity tracking
          across frames yet, so the two flies can swap colors. Next up is live camera input, along with importing your own videos and exporting annotated ones.
          Acceleration currently comes through ONNX Runtime&apos;s Core ML
          execution provider; a native Core ML or Metal backend would plug into
          the same <Code>PoseEstimator</Code> protocol.
        </P>

        <div style={{ marginTop: 48 }}>
          <Rule />
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, marginTop: 20, lineHeight: 1.7 }}>
            Built on the SLEAP ecosystem from Talmo Lab: SLEAP-NN for training and
            export, SLEAP-IO for the Python reference overlays. Inference uses ONNX
            Runtime.
          </p>
        </div>
      </div>
    </div>
  );
}
