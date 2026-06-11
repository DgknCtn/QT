"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signup } from "./actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, { error: "", success: false });

  if (state?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-bg-base)" }}>
        <div className="w-full max-w-sm text-center space-y-4">
          <Image src="/qtlogo.png" alt="QT" width={48} height={48} className="mx-auto rounded-xl" style={{ filter: "invert(1)" }} />
          <div className="rounded-xl p-6 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(52,201,126,0.15)", color: "#34c97e", fontSize: 20 }}>
              ✓
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>E-postanı kontrol et</h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Onay bağlantısı gönderildi. Hesabını etkinleştirmek için e-postana gelen bağlantıya tıkla.
            </p>
          </div>
          <Link href="/login" className="block text-sm hover:underline" style={{ color: "var(--color-accent)" }}>
            Giriş sayfasına dön →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg-base)" }}>

      {/* ── Sol panel: Branding ── */}
      <div
        className="hidden md:flex flex-col items-center justify-center flex-1 relative overflow-hidden"
        style={{ background: "var(--color-bg-elevated)", borderRight: "1px solid var(--color-bg-border)" }}
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Dekoratif grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(var(--color-bg-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-bg-border) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.4,
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6 px-12 text-center">
          <Image
            src="/qtlogo.png"
            alt="QT"
            width={96}
            height={96}
            className="rounded-2xl"
            style={{ filter: "invert(1)" }}
            priority
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              Quarterly Theory
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Personal Trading Workspace
            </p>
          </div>

          <div className="mt-4 space-y-2 text-left">
            {[
              "Trade Journal & Analytics",
              "Funded Account Tracker",
              "Daily Prep & Bias Notes",
              "Knowledge Base",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
                <span style={{ color: "var(--color-accent)", fontSize: 10 }}>◆</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sağ panel: Form ── */}
      <div className="flex flex-col items-center justify-center w-full md:w-[420px] md:shrink-0 px-6 py-12">

        {/* Mobilde logo */}
        <div className="flex md:hidden items-center gap-3 mb-10">
          <Image
            src="/qtlogo.png"
            alt="QT"
            width={32}
            height={32}
            className="rounded-lg"
            style={{ filter: "invert(1)" }}
          />
          <span className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Quarterly Theory
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
              Hesap Oluştur
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Ücretsiz hesabını oluştur
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Ad Soyad
              </label>
              <input
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Adın Soyadın"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--color-bg-border)")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                E-posta
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="ornek@mail.com"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--color-bg-border)")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Şifre
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="En az 8 karakter"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--color-bg-border)")}
              />
            </div>

            {state?.error && (
              <p className="text-xs rounded-lg px-3 py-2.5" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              {pending ? "Hesap oluşturuluyor…" : "Hesap Oluştur"}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: "var(--color-text-muted)" }}>
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--color-accent)" }}>
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
