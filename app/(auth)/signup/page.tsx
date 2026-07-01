"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowRight } from "lucide-react";
import { signup } from "./actions";
import { AuthBackground } from "../auth-background";
import { TextField, PasswordField } from "../auth-fields";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, { error: "", success: false });

  if (state?.success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4">
        <AuthBackground />
        <div className="w-full max-w-sm text-center space-y-4">
          <Image src="/qtlogo.png" alt="QT" width={48} height={48} className="mx-auto rounded-xl" style={{ filter: "invert(1)" }} />
          <div className="auth-card rounded-3xl p-7">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(52,201,126,0.15)", color: "#34c97e", fontSize: 20 }}>
              ✓
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>E-postanı kontrol et</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
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
    <div className="min-h-screen relative flex flex-col">
      <AuthBackground />

      {/* Top-left brand */}
      <div className="flex items-center gap-2.5 px-6 md:px-10 pt-6">
        <Image src="/qtlogo.png" alt="QT" width={30} height={30} className="rounded-lg" style={{ filter: "invert(1)" }} priority />
        <span className="text-sm font-semibold tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.75)" }}>
          Quarterly Theory
        </span>
      </div>

      <div className="flex-1 flex items-center px-6 md:px-10 lg:px-16">
        <div className="w-full grid lg:grid-cols-2 items-center gap-12">
          {/* Left: headline */}
          <div className="hidden lg:block">
            <h1 className="font-serif leading-[0.95]" style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)", color: "var(--color-text-primary)" }}>
              time is
              <br />
              <span className="italic" style={{ color: "rgba(255,255,255,0.45)" }}>everything.</span>
            </h1>
          </div>

          {/* Right: sign-up card */}
          <div className="w-full max-w-md mx-auto lg:ml-auto">
            <div className="auth-card rounded-3xl p-7 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] mb-3" style={{ color: "var(--color-accent)" }}>Sign up</p>
              <h2 className="text-2xl font-bold mb-1.5" style={{ color: "var(--color-text-primary)" }}>Hesap oluştur</h2>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Ücretsiz hesabını oluştur.</p>

              <form action={formAction} className="space-y-4">
                <TextField label="Ad Soyad" name="name" autoComplete="name" placeholder="Adın Soyadın" />
                <TextField label="Email" name="email" type="email" required autoComplete="email" placeholder="trader@qt.io" />
                <PasswordField label="Şifre" autoComplete="new-password" minLength={8} placeholder="En az 8 karakter" />

                {state?.error && (
                  <p className="text-xs rounded-lg px-3 py-2.5" style={{ background: "rgba(239,68,68,0.12)", color: "var(--color-danger)" }}>
                    {state.error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, var(--color-accent), #3b6fd4)", color: "#fff" }}
                >
                  {pending ? <Loader2 size={15} className="animate-spin" /> : null}
                  {pending ? "Hesap oluşturuluyor…" : "Devam et"}
                  {!pending && <ArrowRight size={15} />}
                </button>
              </form>

              <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Zaten hesabın var mı?{" "}
                  <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--color-accent)" }}>Giriş yap</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
