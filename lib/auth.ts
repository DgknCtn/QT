import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

/**
 * Shared server-side auth helpers for Server Actions and Server Components.
 *
 * This module deliberately does NOT carry the "use server" directive: in a
 * "use server" file every export becomes a callable server action, which would
 * expose these helpers as public endpoints. Import them from action files
 * instead of re-declaring a local copy -- the duplicated local variants are how
 * `knowledge/actions.ts` ended up with no auth check at all.
 */

/** The authenticated Supabase user. Throws if there is no session. */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

/** The authenticated user's id -- use this to scope every query and mutation. */
export async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  return user.id;
}

/**
 * Ensures a `User` row exists for the current session and returns it.
 * Supabase owns the auth record; this mirrors it into our own table on first use.
 */
export async function ensureUser(): Promise<User> {
  const user = await getSessionUser();
  return prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email ?? "",
      name: (user.user_metadata?.name as string | undefined) ?? null,
    },
  });
}

/** The current user, but only if they are an ADMIN. Throws otherwise. */
export async function requireAdmin(): Promise<User> {
  const user = await getSessionUser();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") throw new Error("Not authorized");
  return dbUser;
}
