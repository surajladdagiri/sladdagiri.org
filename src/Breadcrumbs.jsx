import { Link } from "react-router-dom";
import { T } from "./theme";

// trail: [{ label, to }, ...]. The last item is the current page (no link).
export default function Breadcrumbs({ trail }) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{ marginBottom: 30, fontFamily: T.mono, fontSize: 12.5, display: "flex", flexWrap: "wrap", alignItems: "center" }}
    >
      {trail.map((c, i) => {
        const last = i === trail.length - 1;
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
            {last || !c.to ? (
              <span style={{ color: T.ink }}>{c.label}</span>
            ) : (
              <Link
                to={c.to}
                style={{ color: T.dim, textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.ink)}
                onMouseLeave={(e) => (e.currentTarget.style.color = T.dim)}
              >
                {c.label}
              </Link>
            )}
            {!last && <span style={{ color: T.faint, margin: "0 9px" }}>/</span>}
          </span>
        );
      })}
    </nav>
  );
}
