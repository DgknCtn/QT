import { createClient } from "@/lib/supabase/server";
import { PrepWizard } from "./prep-wizard";
import { format } from "date-fns";

export default async function NewPrepPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
      <PrepWizard userId={user!.id} />
    </div>
  );
}
