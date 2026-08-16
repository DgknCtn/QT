"use client";

import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { Plus, Pencil, Trash2, AlertTriangle, Eye, Ban, Globe } from "lucide-react";
import { EventForm } from "./event-form";
import { toast } from "sonner";
import { deleteEvent } from "./actions";

type CalendarEvent = {
  id: string;
  /** null = global (seeded) event, shared by every account. */
  userId: string | null;
  dateTime: Date;
  currency: string;
  eventName: string;
  impact: string;
  userRiskTag: string | null;
  noTradeBeforeMinutes: number | null;
  noTradeAfterMinutes: number | null;
  notes: string | null;
};

const impactColor: Record<string, string> = {
  HIGH: "var(--color-danger)",
  MEDIUM: "var(--color-warning)",
  LOW: "var(--color-accent)",
};

const riskTagIcon = (tag: string | null) => {
  if (!tag) return null;
  if (tag === "NO_TRADE_WINDOW") return <Ban size={10} />;
  if (tag === "HIGH_RISK") return <AlertTriangle size={10} />;
  if (tag === "WATCH") return <Eye size={10} />;
  return null;
};

const riskTagColor: Record<string, string> = {
  IGNORE: "var(--color-text-muted)",
  WATCH: "var(--color-warning)",
  HIGH_RISK: "var(--color-danger)",
  NO_TRADE_WINDOW: "var(--color-danger)",
  DATA_HIGH_LOW_RELEVANT: "var(--color-accent)",
};

export function CalendarClient({
  events,
  isAdmin = false,
}: {
  events: CalendarEvent[];
  isAdmin?: boolean;
}) {
  // Global rows are the shared economic calendar -- read-only unless admin.
  const canEdit = (ev: CalendarEvent) => ev.userId !== null || isAdmin;

  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Group by date
  const grouped: Record<string, CalendarEvent[]> = {};
  events.forEach((ev) => {
    const key = format(new Date(ev.dateTime), "yyyy-MM-dd");
    (grouped[key] ??= []).push(ev);
  });
  const sortedDates = Object.keys(grouped).sort();

  async function handleDelete(eventId: string) {
    if (!confirm("Delete this event?")) return;
    setDeleting(eventId);
    try {
      await deleteEvent(eventId);
      toast.success("Etkinlik silindi");
    } catch {
      toast.error("Etkinlik silinemedi");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {events.length} event{events.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <button
          onClick={() => { setEditEvent(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <Plus size={12} /> Add Event
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
        {(["HIGH", "MEDIUM", "LOW"] as const).map((impact) => (
          <span key={impact} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: impactColor[impact] }} />
            {impact}
          </span>
        ))}
      </div>

      {/* Event list */}
      {sortedDates.length === 0 ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No events. Add news events manually.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((dateKey) => {
            const dayEvents = grouped[dateKey];
            const isToday = isSameDay(new Date(dateKey + "T12:00:00"), new Date());
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-2">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: isToday ? "var(--color-accent)" : "var(--color-text-muted)" }}
                  >
                    {isToday ? "TODAY — " : ""}
                    {format(new Date(dateKey + "T12:00:00"), "EEEE, MMMM d")}
                  </p>
                  {isToday && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--color-accent)", color: "#fff" }}>
                      today
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border px-3 py-2 flex items-start justify-between gap-3"
                      style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Impact dot */}
                        <span
                          className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full"
                          style={{ background: impactColor[ev.impact] ?? "var(--color-text-muted)" }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>
                              {new Date(ev.dateTime).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false })}
                            </span>
                            <span
                              className="text-xs font-bold px-1.5 py-0.5 rounded"
                              style={{ background: `${impactColor[ev.impact]}22`, color: impactColor[ev.impact] }}
                            >
                              {ev.currency}
                            </span>
                            <span className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                              {ev.eventName}
                            </span>
                            {ev.userRiskTag && (
                              <span
                                className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded"
                                style={{
                                  background: `${riskTagColor[ev.userRiskTag]}22`,
                                  color: riskTagColor[ev.userRiskTag] ?? "var(--color-text-muted)",
                                }}
                              >
                                {riskTagIcon(ev.userRiskTag)}
                                {ev.userRiskTag.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          {(ev.noTradeBeforeMinutes || ev.noTradeAfterMinutes) && (
                            <p className="text-xs" style={{ color: "var(--color-warning)" }}>
                              No-trade: {ev.noTradeBeforeMinutes ? `${ev.noTradeBeforeMinutes}min before` : ""}
                              {ev.noTradeBeforeMinutes && ev.noTradeAfterMinutes ? " / " : ""}
                              {ev.noTradeAfterMinutes ? `${ev.noTradeAfterMinutes}min after` : ""}
                            </p>
                          )}
                          {ev.notes && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{ev.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {ev.userId === null && (
                          <span
                            className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "var(--color-bg-border)", color: "var(--color-text-muted)" }}
                            title="Genel takvim etkinliği — tüm hesaplarda görünür"
                          >
                            <Globe size={10} /> Genel
                          </span>
                        )}
                        {canEdit(ev) && (
                          <>
                            <button
                              onClick={() => { setEditEvent(ev); setShowForm(true); }}
                              className="p-1 rounded hover:bg-white/5 transition-colors"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(ev.id)}
                              disabled={deleting === ev.id}
                              className="p-1 rounded hover:bg-white/5 transition-colors"
                              style={{ color: "var(--color-text-muted)", opacity: deleting === ev.id ? 0.5 : 1 }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <EventForm
          editEvent={editEvent}
          onClose={() => { setShowForm(false); setEditEvent(null); }}
        />
      )}
    </div>
  );
}
