"use server";

import { createClient } from "@/lib/supabase/server";

type State = { error: string; success: boolean };

export async function signup(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string) || "";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    return { error: error.message, success: false };
  }

  return { error: "", success: true };
}
