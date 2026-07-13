const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function isAllowedUserEmail(email: string | null | undefined): boolean {
  const allowedEmail = process.env.ALLOWED_EMAIL;
  if (!email) return false;
  // The login flow never creates users. Without an explicit allowlist,
  // existing Supabase Auth users remain valid.
  if (!allowedEmail) return true;
  return normalizeEmail(email) === normalizeEmail(allowedEmail);
}
