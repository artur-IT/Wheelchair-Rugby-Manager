/**
 * Host used in Google OAuth redirect_uri. Must match an entry under Google Cloud
 * "Authorized redirect URIs" (same scheme + host + port as users open the app).
 */
export function getOAuthRedirectOrigin(): string {
  if (typeof window === "undefined") {
    return "";
  }
  if (import.meta.env.DEV) {
    return window.location.origin;
  }
  const raw = import.meta.env.PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // fall through
    }
  }
  return window.location.origin;
}
