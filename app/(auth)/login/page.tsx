"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, { error: "" });

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-bg-base)" }}>
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: "var(--color-accent)", color: "#fff" }}>
              QT
            </div>
            <span className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Quarterly Theory
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Personal Trading Workspace
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl p-6 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <h1 className="text-lg font-semibold mb-5" style={{ color: "var(--color-text-primary)" }}>
            Sign in
          </h1>

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 transition-all"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-bg-border)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-border)")}
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-bg-border)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-border)")}
              />
            </div>

            {state?.error && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg py-2 text-sm font-medium transition-opacity disabled:opacity-60"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: "var(--color-text-muted)" }}>
          No account?{" "}
          <Link href="/signup" className="hover:underline" style={{ color: "var(--color-accent)" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
