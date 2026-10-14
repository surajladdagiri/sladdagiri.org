import { Link } from "react-router-dom";
import { T, Eyebrow, Rule, Btn, Tag } from "../theme";
import Breadcrumbs from "../Breadcrumbs";
import Reveal from "../Reveal";
import Hero3D from "../Hero3D";
import Phone3D from "../Phone3D";

const REPO = "https://github.com/surajladdagiri/sladdagiri.org";

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
function Caption({ children }) {
  return <div style={{ fontFamily: T.mono, fontSize: 11.5, letterSpacing: "0.05em", color: T.faint, marginTop: 10 }}>{children}</div>;
}

const STATS = [
  { label: "Frontend", value: "React 19 + Vite" },
  { label: "3D", value: "Hand-written Three.js" },
  { label: "Backend", value: "2 Workers · D1 · R2" },
  { label: "Cost", value: "Free tiers only" },
];

const PIECES = [
  ["Site", "Vercel", "React 19 single-page app. Every route is code-split, and Three.js loads only on pages that use it."],
  ["Analytics Worker", "Cloudflare + D1", "Visitor log, the admin dashboard API, and the private application tracker."],
  ["Theater Worker", "Cloudflare + Durable Object + R2", "Login, the sync room over WebSockets, and signed uploads for video files."],
];

const SYNC = [
  ["Anchored state", "A Durable Object holds one fact: position P was true at server time T, and we're playing. Each browser works out where it should be from that."],
  ["Clock sync first", "Each browser pings the server to estimate the clock offset: five quick pings to converge, then one every 10 seconds. It keeps only the fastest round trip, because a slow sample skews the estimate."],
  ["Steering the speed", "Small drift is fixed by nudging playbackRate a few percent, which you can't see or hear. Only a gap over 1.5 seconds, like a laptop waking from sleep, gets a real seek."],
  ["Seeks wait for both", "Jump ahead and playback holds until both browsers have buffered the new spot, so neither one runs ahead. If one side disconnects, playback pauses."],
];

export default function Website() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 110px" }}>
        <Breadcrumbs trail={[{ label: "Home", to: "/" }, { label: "Work", to: "/portfolio" }, { label: "sladdagiri.org" }]} />

        <Eyebrow n="◦" style={{ marginBottom: 18 }}>Web · Three.js · Cloudflare</Eyebrow>
        <h1 style={{ fontFamily: T.display, fontSize: "clamp(36px,6vw,66px)", fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 0.98, margin: "0 0 22px" }}>
          sladdagiri.org
        </h1>
        <P>
          The site you&apos;re on. The front end is a React 19 single-page app, and all the 3D is written directly in Three.js. Behind it is a small Cloudflare backend that logs visits for an admin dashboard and stores a private tracker for my job and lab applications. It also runs a hidden theater, where two people in different places can watch the same movie in sync. All of it fits in Cloudflare&apos;s and Vercel&apos;s free tiers.
        </P>
        <P>I built it with a lot of help from AI coding tools.</P>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "22px 0 26px" }}>
          {["React 19", "Vite", "Three.js", "Cloudflare Workers", "Durable Objects", "D1", "R2", "WebSockets"].map((t) => <Tag key={t}>{t}</Tag>)}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 30 }}>
          <Btn href={REPO} target="_blank" variant="solid">GitHub</Btn>
          <Btn href={`${REPO}#readme`} target="_blank">README</Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ padding: "16px 18px", borderLeft: i === 0 ? "none" : `1px solid ${T.rule}` }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 500 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <H index="01" label="3D">The point cloud</H>
        <P>
          The shape on the home page is about 3,200 points that morph between a
          sphere, a torus knot, a torus, a cube, and a DNA helix. Each point keeps its identity from shape to shape, which is why the morph looks smooth: every point just slides along its own path. Three.js comes in
          through a dynamic <Code>import()</Code>, so it sits in its own chunk
          and only loads on pages that use it.
        </P>
        <div
          style={{
            position: "relative",
            height: 420,
            borderRadius: T.radius,
            overflow: "hidden",
            border: `1px solid ${T.rule}`,
            background: "radial-gradient(90% 80% at 70% 20%, rgba(255,107,53,0.10), transparent 60%), #0a0a0f",
          }}
        >
          <Hero3D />
        </div>
        <Caption>Live. Move your mouse over it.</Caption>

        <H index="02" label="3D">The iPhone</H>
        <P>
          The phones on the app pages are built from scratch too: an extruded
          rounded-rectangle body, a brushed titanium edge, side buttons, a camera
          bump, and physically based materials lit by an environment map. The
          screen is a texture, so it can show any App Store screenshot. On the app pages it&apos;s tied to scroll. The section pins in place, and the phone spins a full turn for each new screen. The image swaps while its back is to you.
        </P>
        <div style={{ position: "relative", height: 480, maxWidth: 420, margin: "0 auto" }}>
          <Phone3D
            autoCycle
            screenshots={["/ms_1.PNG", "/h_1.PNG", "/ms_2.PNG", "/h_2.PNG"]}
          />
        </div>
        <Caption>
          Music Strip and HAVEN screens. See the scroll version on the{" "}
          <Link to="/musicstrip" style={{ color: T.accent2, textDecoration: "none" }}>Music Strip</Link> and{" "}
          <Link to="/haven" style={{ color: T.accent2, textDecoration: "none" }}>HAVEN</Link> pages.
        </Caption>

        <H index="03" label="Architecture">Three pieces</H>
        <div style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
          {PIECES.map((r, i) => (
            <div key={r[0]} style={{ display: "grid", gridTemplateColumns: "minmax(140px,190px) 1fr", gap: 16, padding: "16px 18px", borderTop: i === 0 ? "none" : `1px solid ${T.rule}` }}>
              <div>
                <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 600 }}>{r[0]}</div>
                <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.accent2, marginTop: 4 }}>{r[1]}</div>
              </div>
              <div style={{ fontFamily: T.body, fontSize: 14.5, lineHeight: 1.6, color: T.dim }}>{r[2]}</div>
            </div>
          ))}
        </div>

        <H index="04" label="Sync">Watching a movie in two places at once</H>
        <P>
          The theater is private, so there&apos;s no link to it. Two people open the same film in an ordinary video player and stay within a fraction of a second of each other. Each browser streams its own copy straight from storage. Keeping the two together is the hard part, because each one decodes and buffers at its own pace and their clocks can be a second or more apart.
        </P>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 8 }}>
          {SYNC.map((s, i) => (
            <Reveal key={s[0]} y={14} delay={i * 50}>
              <div style={{ height: "100%", border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "16px 18px", background: T.surface }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 12, color: T.accent }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontFamily: T.display, fontSize: 16.5, fontWeight: 600 }}>{s[0]}</span>
                </div>
                <div style={{ fontFamily: T.body, fontSize: 14, lineHeight: 1.6, color: T.dim }}>{s[1]}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <div style={{ height: 16 }} />
        <P>
          The video lives in Cloudflare R2, which doesn&apos;t charge for
          downloads, so streaming an 8 GB film to two people costs nothing. The
          browser pulls the file from R2 directly; the Worker only signs requests
          and runs the room. Uploads also go straight from the browser to R2, in parts. Each finished part is recorded locally, so if the connection drops halfway through a 9 GB upload (or I close the tab), it resumes from the last good part.
        </P>

        <H index="05" label="Data">Analytics and the tracker</H>
        <P>
          Every page view sends a small beacon to a Worker, so the Worker sees
          the visitor&apos;s location and network from Cloudflare&apos;s edge.
          It stores the page, a rough location, the network operator, and the
          device in a D1 database, and an admin dashboard reads it back. The same
          Worker runs the private application tracker. Both sit behind a login
          that checks a PBKDF2 password hash and hands back a signed token that
          expires. Passwords and signing keys live only as Worker secrets. What
          the log collects is spelled out on the{" "}
          <Link to="/privacy" style={{ color: T.accent2, textDecoration: "none" }}>privacy page</Link>.
        </P>

        <H index="06" label="Search">SEO for a single-page app</H>
        <P>
          Each route sets its own title, description, canonical link, Open Graph
          tags, and structured data when you navigate to it, backed by a static{" "}
          <Code>robots.txt</Code>, <Code>sitemap.xml</Code>, and{" "}
          <Code>llms.txt</Code>. Private pages get a noindex tag and a Disallow line in robots.txt, and they&apos;re left out of the sitemap. Production builds ship
          without source maps.
        </P>

        <div style={{ marginTop: 48 }}>
          <Rule />
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, marginTop: 20 }}>
            Source on <a href={REPO} target="_blank" rel="noreferrer" style={{ color: T.accent2, textDecoration: "none" }}>GitHub</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
