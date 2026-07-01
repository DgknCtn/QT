/** Animated indigo/blue smoke + grid backdrop for the auth screens.
 * Rendered as an absolute layer inside a `relative` page container; page
 * content must sit in a sibling with `relative z-10`. */
export function AuthBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" style={{ background: "#08090c" }}>
      <div className="auth-smoke-1" />
      <div className="auth-smoke-2" />
      <div className="auth-grid" />
      {/* darken vignette so the card side stays readable */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 100% at 20% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
    </div>
  );
}
