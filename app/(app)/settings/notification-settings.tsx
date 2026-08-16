"use client";

import { useMemo, useState } from "react";
import { useIsHydrated, useStoredValue } from "@/lib/use-stored-value";
import { Bell, CheckCircle } from "lucide-react";
import {
  type NotifPrefs,
  DEFAULT_PREFS,
  PREFS_STORAGE_KEY,
  savePrefs,
} from "@/components/notification-scheduler";

const DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export function NotificationSettings() {
  const hydrated = useIsHydrated();
  const [saved, setSaved]                   = useState(false);
  // Only set once the user answers the browser prompt; before that we read the
  // live value, which is stable for the lifetime of the page.
  const [grantedPermission, setGrantedPermission] = useState<NotificationPermission | null>(null);

  const permission: NotificationPermission =
    grantedPermission ??
    (hydrated && typeof Notification !== "undefined" ? Notification.permission : "default");

  const prefsRaw = useStoredValue(PREFS_STORAGE_KEY, "");
  const storedPrefs = useMemo<NotifPrefs>(() => {
    try {
      return prefsRaw ? { ...DEFAULT_PREFS, ...JSON.parse(prefsRaw) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  }, [prefsRaw]);

  // Unsaved edits layered over what is persisted; cleared once saved.
  const [draft, setDraft] = useState<Partial<NotifPrefs>>({});
  const prefs: NotifPrefs = { ...storedPrefs, ...draft };

  async function requestPermission() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setGrantedPermission(result);
  }

  function update(patch: Partial<NotifPrefs>) {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved(false);
  }

  function handleSave() {
    savePrefs(prefs);
    setDraft({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const supported = typeof Notification !== "undefined";

  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Bildirimler</h3>
        {saved && (
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-success)" }}>
            <CheckCircle size={12} /> Kaydedildi
          </span>
        )}
      </div>

      {!supported && (
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Tarayıcınız bildirim desteklemiyor.
        </p>
      )}

      {supported && permission === "denied" && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>
          Bildirimler engellendi. Tarayıcı ayarlarından izin vermeniz gerekiyor.
        </p>
      )}

      {supported && permission !== "granted" && permission !== "denied" && (
        <button
          type="button"
          onClick={requestPermission}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <Bell size={14} /> Bildirim İzni Ver
        </button>
      )}

      {supported && permission === "granted" && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-success)" }}>
          <CheckCircle size={12} /> Bildirimler aktif
        </p>
      )}

      {/* Daily prep reminder */}
      <div className="space-y-2">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.dailyEnabled}
            onChange={(e) => update({ dailyEnabled: e.target.checked })}
            className="w-3.5 h-3.5 rounded accent-blue-500"
            disabled={permission !== "granted"}
          />
          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Günlük hazırlık hatırlatıcısı
          </span>
        </label>
        {prefs.dailyEnabled && (
          <div className="ml-6">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Saat</label>
            <input
              type="time"
              value={prefs.dailyTime}
              onChange={(e) => update({ dailyTime: e.target.value })}
              className="field-input w-32"
            />
          </div>
        )}
      </div>

      {/* Weekly review reminder */}
      <div className="space-y-2">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.weeklyEnabled}
            onChange={(e) => update({ weeklyEnabled: e.target.checked })}
            className="w-3.5 h-3.5 rounded accent-blue-500"
            disabled={permission !== "granted"}
          />
          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Haftalık review hatırlatıcısı
          </span>
        </label>
        {prefs.weeklyEnabled && (
          <div className="ml-6 flex gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Gün</label>
              <select
                value={prefs.weeklyDay}
                onChange={(e) => update({ weeklyDay: parseInt(e.target.value) })}
                className="field-input"
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Saat</label>
              <input
                type="time"
                value={prefs.weeklyTime}
                onChange={(e) => update({ weeklyTime: e.target.value })}
                className="field-input w-32"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          Kaydet
        </button>
        {permission === "granted" && (
          <button
            type="button"
            onClick={() => {
              new Notification("QT — Test Bildirimi", {
                body: "Bildirimler çalışıyor!",
                icon: "/qtlogo.png",
              });
            }}
            className="px-3 py-2 rounded-lg text-sm border transition-colors"
            style={{ borderColor: "var(--color-bg-border)", color: "var(--color-text-muted)" }}
          >
            Test
          </button>
        )}
      </div>

      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Hatırlatıcılar yalnızca uygulama tarayıcıda açıkken çalışır.
      </p>
    </div>
  );
}
