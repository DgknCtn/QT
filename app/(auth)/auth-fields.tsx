"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputClass =
  "w-full rounded-lg px-3 py-2.5 text-sm outline-none bg-surface border border-app text-primary transition-colors focus:border-[var(--color-accent)]";

export function TextField({
  label, name, type = "text", placeholder, required, autoComplete, autoFocus, minLength,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 text-secondary">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        minLength={minLength}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

export function PasswordField({
  label = "Şifre", name = "password", placeholder = "••••••••", autoComplete = "current-password", minLength,
}: {
  label?: string;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 text-secondary">{label}</label>
      <div className="relative">
        <input
          name={name}
          type={show ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`${inputClass} pr-10`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
