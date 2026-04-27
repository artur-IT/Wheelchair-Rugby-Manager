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

export function getPublicSiteUrl(): string {
  return readEnv("PUBLIC_SITE_URL") ?? "http://localhost:3000";
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

export function isProductionBuild(): boolean {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return Boolean((import.meta.env as { PROD?: boolean }).PROD);
  }
  return process.env.NODE_ENV === "production";
}
