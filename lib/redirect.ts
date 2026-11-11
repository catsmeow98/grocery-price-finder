/*
 * Only allow redirects to pages inside this site.
 * Blocks values like "https://evil.com" or "//evil.com",
 * which would send a freshly logged-in user elsewhere.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/shopping-list"
): string {
  if (
    typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
  ) {
    return next;
  }

  return fallback;
}

/* "/login?next=%2Fshopping-plan" style link helper */
export function withNext(
  path: string,
  next: string | null | undefined
): string {
  return next
    ? `${path}?next=${encodeURIComponent(next)}`
    : path;
}
