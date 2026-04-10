import { useEffect, useState } from "react";
import { Routes, Route, Outlet, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Portfolio from "./pages/Portfolio";
import Demos from "./pages/Demos";
import MusicStrip from "./pages/MusicStrip";
import MusicStripPrivacy from "./pages/MusicStripPrivacy";
import Haven from "./pages/Haven";

const NAV_LINKS = [
  { label: "Portfolio", path: "/portfolio" },
  { label: "Demos", path: "/demos" },
];

function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 10.5L12 3L21 10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.25 9.75V20.25H18.75V9.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

  const navBackground = scrolled
    ? "rgba(11, 11, 12, 0.86)"
    : "rgba(11, 11, 12, 0.62)";

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        width: "100%",
        background: navBackground,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: scrolled ? "0 10px 30px rgba(0,0,0,0.24)" : "none",
        transition:
          "background 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1280,
          margin: "0 auto",
          padding: "14px 24px",
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
            width: 44,
            height: 44,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "#ffffff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition:
              "transform 160ms ease, background 160ms ease, border-color 160ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          }}
        >
          <HomeIcon />
        </button>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
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
                  border: active
                    ? "1px solid rgba(255,255,255,0.14)"
                    : "1px solid transparent",
                  background: active
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                  color: active ? "#ffffff" : "rgba(255,255,255,0.68)",
                  cursor: "pointer",
                  padding: "10px 16px",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  transition:
                    "background 160ms ease, color 160ms ease, border-color 160ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "rgba(255,255,255,0.68)";
                    e.currentTarget.style.background = "transparent";
                  }
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
  }, [location.pathname]);

  return (
    <div
      style={{
        background: "#0b0b0c",
        minHeight: "100vh",
        color: "#ffffff",
      }}
    >
      <NavBar />
      <main style={{ paddingTop: 84 }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="demos" element={<Demos />} />
        <Route path="musicstrip" element={<MusicStrip />} />
        <Route path="musicstrip/privacy" element={<MusicStripPrivacy />} />
        <Route path="haven" element={<Haven />} />
      </Route>
    </Routes>
  );
}
