"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type State = { error: string };

export async function login(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
