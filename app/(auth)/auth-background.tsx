/** Animated aurora (moving indigo/blue/cyan blobs) + grid backdrop for auth
 * screens. Rendered as an absolute layer inside a `relative` page container;
 * page content must sit in a sibling with `relative z-10`. */
export function AuthBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" style={{ background: "#070810" }}>
      <div className="auth-aurora a" />
      <div className="auth-aurora b" />
      <div className="auth-aurora c" />
      <div className="auth-grid" />
      {/* darken vignette so the card side stays readable */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 100% at 15% 40%, transparent 35%, rgba(0,0,0,0.6) 100%)" }} />
    </div>
  );
}
