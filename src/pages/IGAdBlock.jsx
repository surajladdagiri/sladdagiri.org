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
  { label: "Platform", value: "Jailbroken iOS 15+" },
  { label: "Toolchain", value: "Theos + Logos" },
  { label: "Binary", value: "Universal arm64e" },
  { label: "Release", value: "GitHub Releases" },
];

const HOOKS = [
  { k: "Reels", cls: "IGSundialFeedDataSource", d: "Removes IGAdItem from the reel feed's -objectsForListAdapter: return value before it reaches the UI." },
  { k: "Main feed", cls: "IGMainFeedListAdapterDataSource", d: "Removes IGAdItem and Threads suggestion cards from the main timeline." },
  { k: "System", cls: "UIViewController", d: "Intercepts -presentViewController:animated:completion: to block the TestFlight update prompt." },
  { k: "Swift", cls: "Dynamic class resolution", d: "Resolves Swift-backed classes with objc_getClass at load time, then %inits the matching hook group if they exist." },
];

export default function IGAdBlock() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 110px" }}>
        <button onClick={() => navigate("/portfolio")} style={{ border: "none", background: "transparent", color: T.dim, fontFamily: T.mono, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 30 }}>
          ← Work
        </button>

        <Eyebrow n="◦" style={{ marginBottom: 18 }}>Jailbreak tweak · Theos + Logos</Eyebrow>
        <h1 style={{ fontFamily: T.display, fontSize: "clamp(36px,6vw,66px)", fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 0.98, margin: "0 0 22px" }}>
          IGAdBlock
        </h1>
        <P>
          A MobileSubstrate tweak that hooks Instagram&apos;s feed data sources
          at runtime. It takes ads, Threads suggestions, and the TestFlight nag
          screen out of the feed data before the app can show them. To build it,
          I had to reverse-engineer Instagram&apos;s feed code with FLEX and find
          the exact classes and methods to hook.
        </P>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "22px 0 26px" }}>
          {["Runtime hooking", "FLEX RE", "arm64 / arm64e", "Swift class resolution", "GitHub Actions CI"].map((t) => <Tag key={t}>{t}</Tag>)}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 30 }}>
          <Btn href="https://github.com/surajladdagiri/IGAdBlock" target="_blank" variant="solid">GitHub</Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ padding: "16px 18px", borderLeft: i === 0 ? "none" : `1px solid ${T.rule}` }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 500 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <H index="01" label="Approach">How it works</H>
        <P>
          IGAdBlock works at the data source, one step before anything renders.
          It hooks the methods that hand feed items to Instagram&apos;s list
          adapters and drops the ad and suggestion objects from the arrays they
          return. Because the ads are gone from the data, they never reach the
          render step, and there are no blank gaps left where an ad would have
          been.
        </P>

        <H index="02" label="Hook map">What gets intercepted</H>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginTop: 6 }}>
          {HOOKS.map((h) => (
            <div key={h.k} style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: 18, background: T.surface }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.accent, marginBottom: 10 }}>{h.k}</div>
              <div style={{ fontFamily: T.mono, fontSize: 13.5, color: T.ink, marginBottom: 10, wordBreak: "break-word" }}>{h.cls}</div>
              <div style={{ fontFamily: T.body, fontSize: 14, lineHeight: 1.6, color: T.dim }}>{h.d}</div>
            </div>
          ))}
        </div>

        <H index="03" label="Reverse engineering">Finding what to hook</H>
        <P>
          The hooking itself is easy. The work is figuring out what to hook. I
          used FLEX to look at Instagram&apos;s live objects on the device and
          follow how feed items move from the data sources to the list adapters.
          Some of the classes are Swift-backed and only exist at runtime, so the
          tweak resolves them with objc_getClass before it binds. GitHub Actions
          builds and releases the whole thing as a universal arm64/arm64e
          package.
        </P>

        <div style={{ marginTop: 48 }}>
          <Rule />
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, marginTop: 20 }}>
            Open source · built for jailbroken iOS 15+
          </p>
        </div>
      </div>
    </div>
  );
}
