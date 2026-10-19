// Developer / Super-Admin authority configuration
export const DEVELOPER_EMAILS = [
  "shaikh.000.sufiyan@gmail.com",
  (process.env.NEXT_PUBLIC_DEVELOPER_EMAIL || "").toLowerCase().trim(),
].filter(Boolean);

export function isDeveloperEmail(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  return DEVELOPER_EMAILS.some((dev) => dev.toLowerCase() === cleanEmail);
}
