const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function isAllowedUserEmail(email: string | null | undefined): boolean {
  const allowedEmail = process.env.ALLOWED_EMAIL;
  if (!email || !allowedEmail) return false;
  return normalizeEmail(email) === normalizeEmail(allowedEmail);
}

