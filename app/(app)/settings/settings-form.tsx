"use client";

import { useActionState } from "react";
import { saveSettings } from "./actions";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Istanbul",
  "Asia/Tokyo",
  "Asia/Singapore",
  "UTC",
];

type Props = {
  initialName: string;
  initialEmail: string;
  initialTimezone: string;
  initialMaxRisk: number;
};

export function SettingsForm({ initialName, initialEmail, initialTimezone, initialMaxRisk }: Props) {
  const [state, formAction, pending] = useActionState(saveSettings, { error: "", success: false });

  return (
    <form action={formAction} className="space-y-5">
      {/* Profile */}
      <Section title="Profile">
        <Field label="Name">
          <input
            name="name"
            defaultValue={initialName}
            type="text"
            className="field-input"
            placeholder="Your name"
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            defaultValue={initialEmail}
            type="email"
            disabled
            className="field-input opacity-50 cursor-not-allowed"
          />
        </Field>
      </Section>

      {/* Trading preferences */}
      <Section title="Trading Preferences">
        <Field label="Timezone">
          <select name="timezone" defaultValue={initialTimezone} className="field-input">
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </Field>

        {/*
          Burada eskiden bir de "Max daily risk (%)" vardi. Kaldirildi: Risk
          Guard'daki gunluk zarar limitiyle ayni niyetin ikinci, uygulanamaz
          kopyasiydi. Ikisi de "gunluk risk" gibi gorundugu icin kullanici
          yuzdeyi doldurup kaydediyor, "Kaydedildi" goruyor ama dashboard'daki
          uyari kalkmiyordu — cunku o yuzdeyi hicbir sorgu okumuyordu.
          Gun ici durma kurali tek yerde: Risk Guard karti.
        */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="İşlem başına risk (%)">
            <input
              name="maxRiskPerTrade"
              defaultValue={initialMaxRisk}
              type="number"
              step="0.25"
              min="0.1"
              max="10"
              className="field-input"
            />
          </Field>
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Risk hesaplayıcı bu değeri varsayılan olarak kullanır. Gün içi durma
          kuralı ayrı:{" "}
          <a href="#risk-guard" className="underline" style={{ color: "var(--color-accent)" }}>
            Risk Guard
          </a>{" "}
          kartındaki günlük zarar limiti.
        </p>
      </Section>

      {/* Default sessions */}
      <Section title="Preferred Sessions">
        <div className="grid grid-cols-2 gap-2">
          {["London", "NY AM", "NY PM", "Asia"].map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="sessions"
                value={s.replace(" ", "_").toUpperCase()}
                defaultChecked={s === "NY AM"}
                className="w-3.5 h-3.5 rounded accent-blue-500"
              />
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{s}</span>
            </label>
          ))}
        </div>
      </Section>

      {state?.error && (
        <p className="text-sm rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm rounded-lg px-3 py-2" style={{ background: "rgba(52,201,126,0.1)", color: "var(--color-success)" }}>
          Settings saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-opacity"
        style={{ background: "var(--color-accent)", color: "#fff" }}
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
      <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "var(--color-text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}
