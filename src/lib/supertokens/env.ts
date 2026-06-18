/** Read env on Astro server (import.meta.env) or Node (process.env). */
function readEnv(name: string): string | undefined {
  const fromImportMeta =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env as Record<string, string | undefined>)[name];
  if (typeof fromImportMeta === "string" && fromImportMeta.trim()) return fromImportMeta.trim();
  const fromProcess = typeof process !== "undefined" ? process.env[name] : undefined;
  if (typeof fromProcess === "string" && fromProcess.trim()) return fromProcess.trim();
  return undefined;
}

export function getSuperTokensConnectionUri(): string {
  const v = readEnv("SUPERTOKENS_CONNECTION_URI");
  if (!v) throw new Error("SUPERTOKENS_CONNECTION_URI is not set");
  return v;
}

export function getSuperTokensApiKey(): string | undefined {
  return readEnv("SUPERTOKENS_API_KEY");
}

/**
 * Public site origin used by SuperTokens `appInfo` on the server. Must match the URL users open
 * (scheme + host). On Vercel, set `PUBLIC_SITE_URL` explicitly, or rely on `VERCEL_URL` fallback.
 */
export function getPublicSiteUrl(): string {
  const explicit = readEnv("PUBLIC_SITE_URL");
  if (explicit) return explicit;

  // Vercel provides host without scheme (e.g. `my-app.vercel.app`).
  const vercelUrl = readEnv("VERCEL_URL");
  if (vercelUrl) {
    const host = vercelUrl
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      ?.trim();
    if (host) {
      const scheme = host.split(":")[0] === "localhost" ? "http" : "https";
      return `${scheme}://${host}`;
    }
  }

  return "http://localhost:3000";
}

export function getGoogleClientId(): string {
  const v = readEnv("GOOGLE_CLIENT_ID");
  if (!v) throw new Error("GOOGLE_CLIENT_ID is not set");
  return v;
}

export function getGoogleClientSecret(): string {
  const v = readEnv("GOOGLE_CLIENT_SECRET");
  if (!v) throw new Error("GOOGLE_CLIENT_SECRET is not set");
  return v;
}

export function getOptionalGoogleOAuthConfig(): { clientId: string; clientSecret: string } | null {
  const clientId = readEnv("GOOGLE_CLIENT_ID");
  const clientSecret = readEnv("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    return null;
  }
  return { clientId, clientSecret };
}

export function isProductionBuild(): boolean {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return Boolean((import.meta.env as { PROD?: boolean }).PROD);
  }
  return process.env.NODE_ENV === "production";
}
