// ------------------------------------------------------------------
//  Shared design system, "refined dark".
//  Deliberately NO glassmorphism, NO glow orbs, NO backdrop-blur, NO
//  999px pills. Matte surfaces, hairline rules, sharp type, one accent.
//  Every page imports from here so the language stays consistent.
// ------------------------------------------------------------------

export const T = {
  bg: "#0d0d0e",
  bg2: "#131315",
  surface: "#141416",
  surfaceHover: "#191a1c",
  ink: "#ececec",
  dim: "rgba(236,236,236,0.56)",
  faint: "rgba(236,236,236,0.34)",
  rule: "rgba(255,255,255,0.10)",
  ruleStrong: "rgba(255,255,255,0.18)",
  accent: "#e9b64a",
  accentInk: "#0d0d0e",
  green: "#7bbf6a",
  red: "#e06a5a",

  display: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  body: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  mono: '"Space Mono", ui-monospace, "SF Mono", Menlo, monospace',

  // one small radius used everywhere; nothing is a pill
  radius: 6,
  maxW: 1120,
};

// Mono eyebrow label, optionally numbered ("01, WORK").
export function Eyebrow({ n, children, style }) {
  return (
    <span
      style={{
        fontFamily: T.mono,
        fontSize: 12,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: T.dim,
        display: "inline-flex",
        gap: 8,
        alignItems: "baseline",
        ...style,
      }}
    >
      {n != null && <span style={{ color: T.accent }}>{n}</span>}
      {children}
    </span>
  );
}

// Hairline horizontal rule with optional ticks at the ends.
export function Rule({ style }) {
  return (
    <div
      style={{ height: 1, background: T.rule, width: "100%", ...style }}
      aria-hidden
    />
  );
}

// Numbered section header: mono index + rule + display title.
export function SectionHead({ index, label, title, style }) {
  return (
    <div style={{ marginBottom: 28, ...style }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <Eyebrow n={index}>{label}</Eyebrow>
        <div style={{ flex: 1, height: 1, background: T.rule }} />
      </div>
      {title && (
        <h2
          style={{
            fontFamily: T.display,
            fontSize: "clamp(26px,4vw,40px)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            margin: 0,
            color: T.ink,
          }}
        >
          {title}
        </h2>
      )}
    </div>
  );
}

// Rectangular button. variant: "solid" | "ghost". No pill, no blur.
export function Btn({
  children,
  href,
  onClick,
  variant = "ghost",
  download,
  target,
  style,
}) {
  const solid = variant === "solid";
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 18px",
    borderRadius: T.radius,
    fontFamily: T.body,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    cursor: "pointer",
    border: `1px solid ${solid ? T.accent : T.rule}`,
    background: solid ? T.accent : "transparent",
    color: solid ? T.accentInk : T.ink,
    transition: "background 160ms ease, border-color 160ms ease, color 160ms ease",
    textDecoration: "none",
    ...style,
  };
  const enter = (e) => {
    if (solid) {
      e.currentTarget.style.background = "#f0c65e";
    } else {
      e.currentTarget.style.borderColor = T.ruleStrong;
      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
    }
  };
  const leave = (e) => {
    if (solid) {
      e.currentTarget.style.background = T.accent;
    } else {
      e.currentTarget.style.borderColor = T.rule;
      e.currentTarget.style.background = "transparent";
    }
  };
  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        download={download}
        target={target}
        rel={target === "_blank" ? "noreferrer" : undefined}
        style={base}
        onMouseEnter={enter}
        onMouseLeave={leave}
      >
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} style={base} onMouseEnter={enter} onMouseLeave={leave}>
      {children}
    </button>
  );
}

// Matte card with a hairline border. Optional hover lift (no blur, no glow).
export function Card({ children, onClick, hover = true, style }) {
  const base = {
    background: T.surface,
    border: `1px solid ${T.rule}`,
    borderRadius: T.radius,
    transition: "border-color 160ms ease, background 160ms ease, transform 160ms ease",
    cursor: onClick ? "pointer" : "default",
    ...style,
  };
  return (
    <div
      onClick={onClick}
      style={base}
      onMouseEnter={
        hover
          ? (e) => {
              e.currentTarget.style.borderColor = T.ruleStrong;
              e.currentTarget.style.background = T.surfaceHover;
            }
          : undefined
      }
      onMouseLeave={
        hover
          ? (e) => {
              e.currentTarget.style.borderColor = T.rule;
              e.currentTarget.style.background = T.surface;
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

// Small monospace tag (replaces uppercase glass pills). Square-ish.
export function Tag({ children, tone, style }) {
  const color =
    tone === "accent" ? T.accent : tone === "green" ? T.green : T.dim;
  return (
    <span
      style={{
        fontFamily: T.mono,
        fontSize: 11.5,
        letterSpacing: "0.04em",
        color,
        border: `1px solid ${T.rule}`,
        borderRadius: 3,
        padding: "3px 8px",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
