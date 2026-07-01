"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  const initial = (email?.[0] ?? "U").toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-opacity hover:opacity-85"
        style={{ background: "var(--color-accent)", color: "#fff" }}
        title={email ?? "Hesap"}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 card overflow-hidden z-50 p-0">
          {email && (
            <div className="px-3 py-2.5 border-b border-app">
              <p className="text-xs text-muted truncate">{email}</p>
            </div>
          )}
          <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-secondary hover-surface transition-colors">
            <Settings size={14} /> Ayarlar
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover-surface transition-colors">
            <LogOut size={14} /> Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}
