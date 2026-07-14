"use server";

import { createClient } from "@/lib/supabase/server";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import { headers } from "next/headers";

type AuthActionResult = { error: string } | { success: true };

const invalidCredentials = (): AuthActionResult => ({
  error: "Email o contraseña incorrectos",
});

export async function signInWithPassword(
  formData: FormData
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password || !isAllowedUserEmail(email)) {
    return invalidCredentials();
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !isAllowedUserEmail(data.user.email)) {
    if (data.user) await supabase.auth.signOut();
    return invalidCredentials();
  }

  return { success: true };
}

export async function requestPasswordReset(
  formData: FormData
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !isAllowedUserEmail(email)) {
    return { error: "Email no autorizado" };
  }

  const origin = (await headers()).get("origin");
  if (!origin) return { error: "No pudimos validar el origen de la solicitud" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
      "/actualizar-contrasena"
    )}`,
  });

  if (error) return { error: "No pudimos enviar el correo de recuperación" };
  return { success: true };
}

export async function updatePassword(
  formData: FormData
): Promise<AuthActionResult> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (password.length < 10) {
    return { error: "Usa una contraseña de al menos 10 caracteres" };
  }
  if (password !== confirmation) {
    return { error: "Las contraseñas no coinciden" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !isAllowedUserEmail(user.email)) {
    return { error: "La sesión de recuperación ya no es válida" };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: true };
}
