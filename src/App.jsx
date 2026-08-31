import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
// Home and the 404 stay eager: Home is the landing page, and NotFound is the
// Suspense fallback's fallback. Everything else is code-split by route so the
// initial download stays small. Atlas in particular pulls in framer-motion and
// a large data module, which now load only when someone opens /atlas.
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { T } from "./theme";
import { sendBeacon } from "./analytics";
import { applyMeta } from "./seo";

const Portfolio = lazy(() => import("./pages/Portfolio"));
const Demos = lazy(() => import("./pages/Demos"));
const MusicStrip = lazy(() => import("./pages/MusicStrip"));
const MusicStripPrivacy = lazy(() => import("./pages/MusicStripPrivacy"));
const Haven = lazy(() => import("./pages/Haven"));
const HavenPrivacy = lazy(() => import("./pages/HavenPrivacy"));
const IGAdBlock = lazy(() => import("./pages/IGAdBlock"));
const CongressML = lazy(() => import("./pages/CongressML"));
const Atlas = lazy(() => import("./pages/Atlas"));
const Theater = lazy(() => import("./pages/Theater"));
const Upload = lazy(() => import("./pages/Upload"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

// Logs a page view on every route change. The admin dashboard itself is not
// logged. Fails silently and never blocks rendering.
function VisitBeacon() {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith("/dashboard")) return;
    sendBeacon(location.pathname);
  }, [location.pathname]);
  return null;
}

const NAV_LINKS = [
  { label: "Work", path: "/portfolio" },
  { label: "Demos", path: "/demos" },
];

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

const FOOTER_LINKS = [
  { label: "Home", to: "/" },
  { label: "Work", to: "/portfolio" },
  { label: "HAVEN", to: "/haven" },
  { label: "Music Strip", to: "/musicstrip" },
  { label: "Congressional Vote Prediction", to: "/congress" },
  { label: "IGAdBlock", to: "/igadblock" },
  { label: "Demos", to: "/demos" },
];

function Footer() {
  const link = {
    color: T.dim,
    textDecoration: "none",
    fontFamily: T.body,
    fontSize: 14,
  };
  return (
    <footer style={{ borderTop: `1px solid ${T.rule}`, marginTop: 40 }}>
      <div style={{ maxWidth: T.maxW, margin: "0 auto", padding: "40px 24px 56px" }}>
        <div style={{ fontFamily: T.display, fontSize: 16, fontWeight: 600, marginBottom: 18 }}>
          Suraj Laddagiri
        </div>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: "10px 22px", marginBottom: 22 }}>
          {FOOTER_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={link}
              onMouseEnter={(e) => (e.currentTarget.style.color = T.ink)}
              onMouseLeave={(e) => (e.currentTarget.style.color = T.dim)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 22px" }}>
          <a href="https://github.com/surajladdagiri" target="_blank" rel="noreferrer" style={link}>GitHub</a>
          <a href="https://www.linkedin.com/in/suraj-laddagiri-903602272/" target="_blank" rel="noreferrer" style={link}>LinkedIn</a>
          <a href="/Suraj_Laddagiri_Resume.pdf" target="_blank" rel="noreferrer" style={link}>Résumé</a>
        </div>
      </div>
    </footer>
  );
}

function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    applyMeta(location.pathname);
  }, [location.pathname]);

  return (
    <div
      style={{
        background: T.bg,
        minHeight: "100vh",
        color: T.ink,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar />
      <main style={{ paddingTop: 72, flex: 1 }}>
        <Suspense fallback={<div style={{ minHeight: "70vh" }} />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
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
        <Route path="*" element={<NotFound />} />
      </Route>
      {/* unlisted */}
      <Route
        path="/atlas"
        element={
          <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0d0d0e" }} />}>
            <Atlas />
          </Suspense>
        }
      />
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
        path="/dashboard"
        element={
          <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0d0d0e" }} />}>
            <Dashboard />
          </Suspense>
        }
      />
      </Routes>
    </>
  );
}
