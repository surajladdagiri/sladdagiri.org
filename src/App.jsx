import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Outlet, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Portfolio from "./pages/Portfolio";
import Demos from "./pages/Demos";
import MusicStrip from "./pages/MusicStrip";
import MusicStripPrivacy from "./pages/MusicStripPrivacy";
import Haven from "./pages/Haven";
import HavenPrivacy from "./pages/HavenPrivacy";
import IGAdBlock from "./pages/IGAdBlock";
import CongressML from "./pages/CongressML";
import Atlas from "./pages/Atlas";
import { T } from "./theme";
import { sendBeacon } from "./analytics";

const Theater = lazy(() => import("./pages/Theater"));
const Upload = lazy(() => import("./pages/Upload"));
const Secret = lazy(() => import("./pages/Secret"));

// Logs a page view on every route change. The admin dashboard itself is not
// logged. Fails silently and never blocks rendering.
function VisitBeacon() {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith("/secret")) return;
    sendBeacon(location.pathname);
  }, [location.pathname]);
  return null;
}

const NAV_LINKS = [
  { label: "Work", path: "/portfolio" },
  { label: "Demos", path: "/demos" },
];

function getDocumentTitle(pathname) {
  if (pathname === "/") return "Suraj Laddagiri | Portfolio";
  if (pathname === "/portfolio") return "Portfolio | Suraj Laddagiri";
  if (pathname === "/demos") return "Demos | Suraj Laddagiri";
  if (pathname === "/musicstrip") return "Music Strip | Suraj Laddagiri";
  if (pathname === "/musicstrip/privacy") {
    return "Music Strip Privacy | Suraj Laddagiri";
  }
  if (pathname === "/haven") return "HAVEN | Suraj Laddagiri";
  if (pathname === "/haven/privacy") return "HAVEN Privacy | Suraj Laddagiri";
  if (pathname === "/igadblock") return "IGAdBlock | Suraj Laddagiri";
  if (pathname === "/congress") return "Congressional Vote Prediction | Suraj Laddagiri";

  return "Suraj Laddagiri";
}

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        width: "100%",
        // Solid matte bar, no translucency, no backdrop blur.
        background: T.bg,
        borderBottom: `1px solid ${scrolled ? T.rule : "transparent"}`,
        transition: "border-color 200ms ease",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: T.maxW,
          margin: "0 auto",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <button
          onClick={() => {
            navigate("/");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="Go to home"
          style={{
            border: "none",
            background: "transparent",
            color: T.ink,
            cursor: "pointer",
            padding: 0,
            fontFamily: T.display,
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          Suraj Laddagiri
        </button>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            justifyContent: "flex-end",
          }}
        >
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: active ? T.ink : T.dim,
                  cursor: "pointer",
                  padding: "8px 14px",
                  fontFamily: T.mono,
                  fontSize: 13,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  borderBottom: `1px solid ${active ? T.accent : "transparent"}`,
                  borderRadius: 0,
                  transition: "color 160ms ease, border-color 160ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = T.ink;
                  if (!active) e.currentTarget.style.borderColor = T.rule;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = active ? T.ink : T.dim;
                  if (!active) e.currentTarget.style.borderColor = "transparent";
                }}
              >
                {link.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.title = getDocumentTitle(location.pathname);
  }, [location.pathname]);

  return (
    <div
      style={{
        background: T.bg,
        minHeight: "100vh",
        color: T.ink,
      }}
    >
      <NavBar />
      <main style={{ paddingTop: 72 }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <>
      <VisitBeacon />
      <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="demos" element={<Demos />} />
        <Route path="musicstrip" element={<MusicStrip />} />
        <Route path="musicstrip/privacy" element={<MusicStripPrivacy />} />
        <Route path="haven" element={<Haven />} />
        <Route path="haven/privacy" element={<HavenPrivacy />} />
        <Route path="igadblock" element={<IGAdBlock />} />
        <Route path="congress" element={<CongressML />} />
      </Route>
      {/* unlisted */}
      <Route path="/atlas" element={<Atlas />} />
      {/* Lazy on purpose: code-splitting keeps this out of the main bundle, so
          someone reading the site's JS never sees it referenced at all. */}
      <Route
        path="/t"
        element={
          <Suspense fallback={<div style={{ minHeight: "100vh", background: "#050506" }} />}>
            <Theater />
          </Suspense>
        }
      />
      <Route
        path="/u"
        element={
          <Suspense fallback={<div style={{ minHeight: "100vh", background: "#050506" }} />}>
            <Upload />
          </Suspense>
        }
      />
      <Route
        path="/secret"
        element={
          <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0d0d0e" }} />}>
            <Secret />
          </Suspense>
        }
      />
      </Routes>
    </>
  );
}
