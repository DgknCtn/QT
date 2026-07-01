"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { login } from "./actions";
import { AuthBranding, AuthMobileHeader } from "../auth-branding";
import { TextField, PasswordField } from "../auth-fields";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, { error: "" });

  return (
    <div className="min-h-screen flex bg-base">
      <AuthBranding />

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center w-full md:w-[420px] md:shrink-0 px-6 py-12">
        <AuthMobileHeader />

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-xl font-bold mb-1 text-primary">Giriş Yap</h2>
            <p className="text-sm text-muted">Hesabına giriş yap</p>
          </div>

          <form action={formAction} className="space-y-4">
            <TextField label="E-posta" name="email" type="email" required autoComplete="email" autoFocus placeholder="ornek@mail.com" />
            <PasswordField autoComplete="current-password" />

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
              {pending ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>

          <p className="text-center text-xs mt-5 text-muted">
            Hesabın yok mu?{" "}
            <Link href="/signup" className="font-medium text-accent hover:underline">Kayıt ol</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
