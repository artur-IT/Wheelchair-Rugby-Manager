/**
 * Public site base URL for OAuth redirect_uri and absolute links.
 * Prefer PUBLIC_SITE_URL in production; falls back to the incoming request origin.
 */
export function getPublicSiteUrl(requestUrl: URL): string {
  const fromEnv = import.meta.env.PUBLIC_SITE_URL;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/$/, "");
  }
  return requestUrl.origin;
}
