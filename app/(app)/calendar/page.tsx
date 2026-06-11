import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { addDays, subDays } from "date-fns";
import { CalendarClient } from "./calendar-client";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  // Show events from -7 days to +30 days
  const events = dbUser
    ? await prisma.economicEvent.findMany({
        where: {
          userId: user.id,
          dateTime: { gte: subDays(new Date(), 7), lte: addDays(new Date(), 30) },
        },
        orderBy: { dateTime: "asc" },
      }).catch(() => [])
    : [];

  return <CalendarClient userId={user.id} events={events as any} />;
}
