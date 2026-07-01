"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { signup } from "./actions";
import { AuthBranding, AuthMobileHeader } from "../auth-branding";
import { TextField, PasswordField } from "../auth-fields";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, { error: "", success: false });

  if (state?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-base">
        <div className="w-full max-w-sm text-center space-y-4">
          <Image src="/qtlogo.png" alt="QT" width={48} height={48} className="mx-auto rounded-xl" style={{ filter: "invert(1)" }} />
          <div className="card p-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(52,201,126,0.15)", color: "#34c97e", fontSize: 20 }}>
              ✓
            </div>
            <h2 className="text-lg font-semibold mb-2 text-primary">E-postanı kontrol et</h2>
            <p className="text-sm text-secondary">
              Onay bağlantısı gönderildi. Hesabını etkinleştirmek için e-postana gelen bağlantıya tıkla.
            </p>
          </div>
          <Link href="/login" className="block text-sm text-accent hover:underline">
            Giriş sayfasına dön →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-base">
      <AuthBranding />

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center w-full md:w-[420px] md:shrink-0 px-6 py-12">
        <AuthMobileHeader />

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-xl font-bold mb-1 text-primary">Hesap Oluştur</h2>
            <p className="text-sm text-muted">Ücretsiz hesabını oluştur</p>
          </div>

          <form action={formAction} className="space-y-4">
            <TextField label="Ad Soyad" name="name" autoComplete="name" placeholder="Adın Soyadın" />
            <TextField label="E-posta" name="email" type="email" required autoComplete="email" placeholder="ornek@mail.com" />
            <PasswordField label="Şifre" autoComplete="new-password" minLength={8} placeholder="En az 8 karakter" />

            {state?.error && (
              <p className="text-xs rounded-lg px-3 py-2.5" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              {pending && <Loader2 size={14} className="animate-spin" />}
              {pending ? "Hesap oluşturuluyor…" : "Hesap Oluştur"}
            </button>
          </form>

          <p className="text-center text-xs mt-5 text-muted">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">Giriş yap</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
