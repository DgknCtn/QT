/** Animated indigo/blue smoke + grid backdrop for the auth screens. */
export function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: "#08090c" }}>
      <div className="auth-smoke-1" />
      <div className="auth-smoke-2" />
      <div className="auth-grid" />
      {/* darken vignette so the card side stays readable */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 100% at 20% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
    </div>
  );
}
