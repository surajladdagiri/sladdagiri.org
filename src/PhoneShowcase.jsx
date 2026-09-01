import { useEffect, useRef, useState } from "react";
import { T } from "./theme";
import Phone3D from "./Phone3D";

/* A pinned, scroll-scrubbed iPhone. The section stays fixed on screen while you
   scroll; the phone slides in from the left, then turns to reveal each
   screenshot in turn. A caption below tracks the current screen. Once the
   sequence finishes, the pin releases and the page continues. */
export default function PhoneShowcase({ screenshots = [], captions = [], label, sub, heightVh }) {
  const n = Math.max(1, screenshots.length);
  const vh = heightVh || 120 + n * 90;
  const trackRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setEntered(true); return; }
    let raf = 0;
    const update = () => {
      const el = trackRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const denom = r.height - window.innerHeight;
      const p = denom > 0 ? Math.min(1, Math.max(0, -r.top / denom)) : 0;
      setEntered(true);
      setIdx(Math.min(n - 1, Math.round(p * (n - 1))));
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [n]);

  return (
    <div ref={trackRef} data-phone-track style={{ position: "relative", height: `${vh}vh` }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <div style={{ position: "relative", width: "min(340px, 82vw)", height: "min(68vh, 620px)" }}>
          <Phone3D showcase screenshots={screenshots} label={label} sub={sub} />
        </div>

        {n > 1 && (
          <div style={{ height: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {captions[idx] && (
              <div
                key={idx}
                style={{
                  fontFamily: T.display,
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: T.ink,
                  opacity: entered ? 1 : 0,
                  transition: "opacity 300ms ease",
                }}
              >
                {captions[idx]}
              </div>
            )}
            <div style={{ display: "flex", gap: 7 }}>
              {Array.from({ length: n }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: i === idx ? 20 : 7,
                    height: 7,
                    borderRadius: 999,
                    background: i === idx ? T.accent : T.rule,
                    transition: "all 240ms ease",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
