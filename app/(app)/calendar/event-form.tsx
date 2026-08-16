"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveEvent } from "./actions";
import { X } from "lucide-react";

type Event = {
  id: string;
  dateTime: Date;
  currency: string;
  eventName: string;
  impact: string;
  userRiskTag: string | null;
  noTradeBeforeMinutes: number | null;
  noTradeAfterMinutes: number | null;
  notes: string | null;
};

export function EventForm({
  editEvent,
  onClose,
}: {
  editEvent?: Event | null;
  onClose: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const dt = editEvent ? new Date(editEvent.dateTime) : null;
  const defaultDate = dt ? dt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
  const defaultTime = dt ? `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}` : "08:30";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const form = new FormData(formRef.current!);
    startTransition(async () => {
      try {
        await saveEvent(form);
        toast.success(editEvent ? "Etkinlik güncellendi" : "Etkinlik eklendi");
        onClose();
      } catch {
        setError("Failed to save event. Please try again.");
        toast.error("Etkinlik kaydedilemedi");
      }
    });
  }

  const inputCls = "field-input";
  const labelCls = "step-label";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl border p-5 space-y-4"
        style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {editEvent ? "Edit Event" : "Add News Event"}
          </h2>
          <button onClick={onClose} style={{ color: "var(--color-text-muted)" }}><X size={16} /></button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          {editEvent && <input type="hidden" name="id" value={editEvent.id} />}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" name="date" defaultValue={defaultDate} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Time (local)</label>
              <input type="time" name="time" defaultValue={defaultTime} required className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Currency</label>
              <input type="text" name="currency" defaultValue={editEvent?.currency ?? "USD"} placeholder="USD" maxLength={5} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Impact</label>
              <select name="impact" defaultValue={editEvent?.impact ?? "HIGH"} className={inputCls}>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Event Name</label>
            <input type="text" name="eventName" defaultValue={editEvent?.eventName ?? ""} placeholder="e.g. CPI, NFP, FOMC" required className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Risk Tag</label>
            <select name="userRiskTag" defaultValue={editEvent?.userRiskTag ?? ""} className={inputCls}>
              <option value="">— none —</option>
              <option value="IGNORE">IGNORE</option>
              <option value="WATCH">WATCH</option>
              <option value="HIGH_RISK">HIGH RISK</option>
              <option value="NO_TRADE_WINDOW">NO TRADE WINDOW</option>
              <option value="DATA_HIGH_LOW_RELEVANT">DATA HIGH/LOW RELEVANT</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>No-trade before (min)</label>
              <input type="number" name="noTradeBefore" defaultValue={editEvent?.noTradeBeforeMinutes ?? ""} min="0" max="120" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>No-trade after (min)</label>
              <input type="number" name="noTradeAfter" defaultValue={editEvent?.noTradeAfterMinutes ?? ""} min="0" max="120" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea name="notes" defaultValue={editEvent?.notes ?? ""} rows={2} className={inputCls} style={{ resize: "vertical" }} />
          </div>

          {error && <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--color-accent)", color: "#fff", opacity: pending ? 0.6 : 1 }}
            >
              {pending ? "Saving…" : editEvent ? "Update" : "Add Event"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: "var(--color-bg-surface)", color: "var(--color-text-secondary)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
