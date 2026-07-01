import Image from "next/image";

const FEATURES = [
  "Trade Journal & Analytics",
  "Funded Account Tracker",
  "Daily Prep & Bias Notes",
  "Knowledge Base",
];

/** Left branding panel (desktop) shared by login & signup. */
export function AuthBranding() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center flex-1 relative overflow-hidden bg-elevated" style={{ borderRight: "1px solid var(--color-bg-border)" }}>
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />
      {/* Decorative grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(var(--color-bg-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-bg-border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.4,
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-6 px-12 text-center">
        <Image src="/qtlogo.png" alt="QT" width={96} height={96} className="rounded-2xl" style={{ filter: "invert(1)" }} priority />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Quarterly Theory</h1>
          <p className="text-sm text-muted">Personal Trading Workspace</p>
        </div>
        <div className="mt-4 space-y-2 text-left">
          {FEATURES.map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-sm text-muted">
              <span className="text-accent" style={{ fontSize: 10 }}>◆</span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mobile logo header shared by login & signup. */
export function AuthMobileHeader() {
  return (
    <div className="flex md:hidden items-center gap-3 mb-10">
      <Image src="/qtlogo.png" alt="QT" width={32} height={32} className="rounded-lg" style={{ filter: "invert(1)" }} />
      <span className="text-base font-semibold text-primary">Quarterly Theory</span>
    </div>
  );
}
