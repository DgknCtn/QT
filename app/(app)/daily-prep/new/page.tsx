import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrepWizard } from "./prep-wizard";
import { getCalendarEventsForDate, getLastPrepCarryOver, getTrueOpenLevels } from "./actions";
import { format } from "date-fns";

export default async function NewPrepPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  // Next 16'da searchParams bir Promise.
  const { from } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [calendarEvents, carryOver, trueOpenLevels] = await Promise.all([
    getCalendarEventsForDate(new Date()),
    // `?from=last` ile gelindiyse alanlar hazır dolu açılır; her hâlükârda
    // çekilir ki sihirbaz "Son prep'ten doldur" düğmesini gösterebilsin.
    getLastPrepCarryOver(),
    getTrueOpenLevels(),
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5">
        <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
        <h2 className="text-base font-semibold" style={{ color: "var(--color-text-secondary)" }}>
          New Daily Prep
        </h2>
      </div>
      <PrepWizard
        calendarEvents={calendarEvents}
        carryOver={carryOver}
        applyCarryOverOnLoad={from === "last"}
        trueOpenLevels={trueOpenLevels}
        userId={user.id}
      />
    </div>
  );
}
