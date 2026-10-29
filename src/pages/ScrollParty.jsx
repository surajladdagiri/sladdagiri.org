import { Link } from "react-router-dom";
import { T, Eyebrow, Rule, Btn, Tag } from "../theme";
import Breadcrumbs from "../Breadcrumbs";
import Phone3D from "../Phone3D";
import Reveal from "../Reveal";

const REPO = "https://github.com/surajladdagiri/ScrollParty";

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
  return <code style={{ fontFamily: T.mono, fontSize: 13.5, color: T.accent2, wordBreak: "break-word" }}>{children}</code>;
}
function Pre({ children }) {
  return (
    <pre style={{ fontFamily: T.mono, fontSize: 12.5, lineHeight: 1.65, color: T.dim, background: T.bg2, border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "14px 16px", margin: "4px 0 18px", overflowX: "auto" }}>
      {children}
    </pre>
  );
}

const STATS = [
  { label: "Platform", value: "Jailbroken iOS" },
  { label: "Toolchain", value: "Theos + Logos" },
  { label: "Target", value: "Instagram Reels" },
  { label: "Stage", value: "Feed reconstruction" },
];

const SIGNALS = [
  { k: "Next / previous", cls: "activeSectionDidChangeFrom:to:", d: "The section index goes up by one on a scroll down and down by one on a scroll up. My first try used video callbacks, which missed photo Reels; this one works for video, photo, and carousel posts." },
  { k: "Play / pause", cls: "playWithReason: · pauseWithReason:", d: "Normal playback reports reason 1 and a tap-to-pause reports reason 7. Reason 3 also shows up when comments open, so it can't be treated as a pause on its own." },
  { k: "2x speed", cls: "setPlaybackSpeed:", d: "A long press sets 2.0 and letting go sets 1.0, which makes it the cleanest signal for the 2x state." },
  { k: "Comments", cls: "IGCommentThreadViewController", d: "viewDidAppear: and viewDidDisappear: line up with the comment sheet opening and closing." },
  { k: "Refresh", cls: "willStartNewFeedSessionWithId:…", d: "A manual pull-to-refresh comes through with prefetchType 0, and app startup with prefetchType 3." },
  { k: "The feed", cls: "objectsForListAdapter:", d: "The Reels data source hands its list adapter an array of IGMedia objects. The same hook IGAdBlock uses can read that array and change it." },
];

const STATUS = [
  { k: "Working", color: T.green, items: ["Detecting next and previous Reels", "Detecting play, pause, and 2x speed", "Detecting comments opening and closing", "Detecting a feed refresh", "Reading and editing the Reels feed array", "Tracing how IGMediaMap builds media"] },
  { k: "In progress", color: T.accent2, items: ["Rebuilding an IGMedia from a media PK or a saved dictionary", "Forcing the feed to a fixed custom list", "Finding the methods that perform next, previous, and comments", "Syncing the position inside carousel posts"] },
  { k: "Not started", color: T.faint, items: ["WebSocket client and relay server", "Room codes", "Syncing state between phones", "Reconnecting and catching up"] },
];

export default function ScrollParty() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 110px" }}>
        <Breadcrumbs trail={[{ label: "Home", to: "/" }, { label: "Work", to: "/portfolio" }, { label: "ScrollParty" }]} />

        <Eyebrow n="◦" style={{ marginBottom: 18 }}>Jailbreak tweak · In progress</Eyebrow>
        <h1 style={{ fontFamily: T.display, fontSize: "clamp(36px,6vw,66px)", fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 0.98, margin: "0 0 22px" }}>
          ScrollParty
        </h1>
        <P>
          An experimental tweak for watching Instagram Reels with a friend, each
          on your own phone. The idea is that either person can scroll, pause,
          hold for 2x, or open the comments, and the other phone does the same
          thing at the same moment.
        </P>
        <P>
          It&apos;s still being built. The tweak can already see everything the
          viewer does in Reels. The part I&apos;m working on now is getting one
          person&apos;s feed to show up on the other person&apos;s phone, and the
          networking comes after that.
        </P>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "22px 0 26px" }}>
          {["Reverse engineering", "Objective-C runtime", "Theos + Logos", "Real-time sync", "In progress"].map((t) => <Tag key={t}>{t}</Tag>)}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 30 }}>
          <Btn href={REPO} target="_blank" variant="solid">GitHub</Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ padding: "16px 18px", borderLeft: i === 0 ? "none" : `1px solid ${T.rule}` }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 500 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "8px 0 0" }}>
          <div style={{ position: "relative", height: 380 }}><Phone3D label="ScrollParty" sub="Phone A" /></div>
          <div style={{ position: "relative", height: 380 }}><Phone3D label="ScrollParty" sub="Phone B" /></div>
        </div>
        <div style={{ textAlign: "center", fontFamily: T.mono, fontSize: 11.5, letterSpacing: "0.05em", color: T.faint }}>Two phones, one feed</div>

        <H index="01" label="The problem">Two accounts, two different feeds</H>
        <P>
          Syncing taps alone would fall apart right away, because Instagram
          gives every account its own personalized Reels feed. If my phone
          scrolls to the next Reel, my friend&apos;s phone would scroll to the
          next Reel in their own feed, which is a completely different video. So
          ScrollParty has to sync two things: the feed itself (which Reels, in
          what order) and the viewer state on top of it (which Reel, playing or
          paused, what speed, comments open or closed).
        </P>

        <H index="02" label="Detection">What it can see</H>
        <P>
          Most of the work so far has been mapping Instagram&apos;s private
          classes at runtime to find a reliable signal for each action. Each of
          these is confirmed by testing on the current Instagram build.
        </P>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12, marginTop: 6 }}>
          {SIGNALS.map((h, i) => (
            <Reveal key={h.k} y={14} delay={i * 40}>
              <div style={{ height: "100%", border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: 18, background: T.surface }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.accent, marginBottom: 10 }}>{h.k}</div>
                <div style={{ fontFamily: T.mono, fontSize: 13, color: T.ink, marginBottom: 10, wordBreak: "break-word" }}>{h.cls}</div>
                <div style={{ fontFamily: T.body, fontSize: 14, lineHeight: 1.6, color: T.dim }}>{h.d}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <H index="03" label="Reconstruction">Rebuilding one person&apos;s feed on another phone</H>
        <P>
          The plan is to send something small and portable between phones and
          let the second phone build its own <Code>IGMedia</Code> objects from
          it. Ideally that&apos;s just the
          media ID (the PK). If the PK isn&apos;t enough, the fallback is the
          dictionary Instagram passes into <Code>mediaWithDict:</Code>, as long
          as it survives a trip through JSON.
        </P>
        <Pre>{`Phone A:  feed  ->  media PKs (or dictionaries)  ->  server
Phone B:  server  ->  IGMediaMap  ->  local IGMedia  ->  objectsForListAdapter:`}</Pre>
        <P>
          To get there I&apos;ve been tracing <Code>IGMediaMap</Code>, the class
          that builds and caches media objects. My current read of it is that{" "}
          <Code>mediaWithDict:</Code> pulls out the PK, checks the map for an
          existing object, creates one with{" "}
          <Code>constructInstanceWithPK:initialTree:</Code> if it&apos;s
          missing, and then fills it in from the dictionary. Next I&apos;m
          hooking <Code>updateInstance:withDictionary:</Code> to confirm the
          same object flows through every step.
        </P>
        <P>
          The test plan goes from easy to hard: resolve a Reel already seen this
          session, then one seen before a cold relaunch, then one the receiving
          phone has never loaded, which is the real test. After that comes a
          fixed five-item feed mixing video, photo, and carousel posts, and
          finally moving that same feed to a second phone by hand before any
          server exists.
        </P>

        <H index="04" label="Sync design">How the phones will stay together</H>
        <P>
          The first network version will be a WebSocket relay. Each phone
          watches for local actions, sends a small event to the server, and the
          server gives it a revision number and passes it to the other phone,
          which performs the same action. Video and images still load straight
          from Instagram on each phone; the server only passes along state.
        </P>
        <P>
          Relative events like &quot;next&quot; can drift: one missed message
          and the phones are on different Reels. So the server will also keep a
          full snapshot of the room that a phone can resync from at any time.
          It&apos;s the same idea the movie theater on{" "}
          <Link to="/website" style={{ color: T.accent2, textDecoration: "none" }}>this site</Link>{" "}
          uses.
        </P>
        <Pre>{`{ "revision": 42, "feedIndex": 12, "mediaPk": "4010786467422345960",
  "carouselIndex": 0, "playing": true, "speed": 1.0, "commentsOpen": false }`}</Pre>
        <P>
          There&apos;s also an echo problem to solve. When a remote pause
          arrives and the tweak calls <Code>pauseWithReason:</Code>, its own
          pause hook fires and would send the pause right back. The first
          version will block that with a flag while applying remote actions;
          later versions will tag every event with an ID, the sending client,
          and the server revision. And because the second account may not be
          able to see every Reel (private or blocked accounts, deleted posts,
          region limits), the protocol will need a way to report an unavailable
          Reel and skip past it cleanly.
        </P>

        <H index="05" label="Status">Where it stands</H>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>
          {STATUS.map((s) => (
            <div key={s.k} style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, padding: "16px 18px", background: T.surface }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: s.color, marginBottom: 10 }}>{s.k}</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontFamily: T.body, fontSize: 14, lineHeight: 1.65, color: T.dim }}>
                {s.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ height: 16 }} />
        <P>Networking waits until a feed can be rebuilt on a single phone.</P>

        <div style={{ marginTop: 48 }}>
          <Rule />
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, marginTop: 20, lineHeight: 1.7 }}>
            Experimental · open source · Instagram&apos;s private class names change between versions, so everything here reflects the build I tested.
          </p>
        </div>
      </div>
    </div>
  );
}
