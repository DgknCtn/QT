import { LevelForm } from "../level-form";

export default function NewLevelPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Yeni Level</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Fiyat seviyesi ekle</p>
      </div>
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
      >
        <LevelForm />
      </div>
    </div>
  );
}
