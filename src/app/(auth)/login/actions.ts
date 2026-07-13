"use server";

import { createClient } from "@/lib/supabase/server";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import { headers } from "next/headers";

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Email requerido" };
  if (!isAllowedUserEmail(email)) return { error: "Email no autorizado" };

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
