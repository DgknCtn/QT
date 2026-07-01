"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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
      <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        minLength={minLength}
        placeholder={placeholder}
        className="auth-input"
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
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {show ? <EyeOff size={12} /> : <Eye size={12} />} {show ? "Gizle" : "Göster"}
        </button>
      </div>
      <input
        name={name}
        type={show ? "text" : "password"}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="auth-input"
      />
    </div>
  );
}
