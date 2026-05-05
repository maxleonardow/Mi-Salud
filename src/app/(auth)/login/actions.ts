"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) return { error: "Email requerido" };

  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  if (!origin) return { error: "Origin header missing" };

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message };
  return { success: true as const };
}
