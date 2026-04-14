import * as client from "openid-client";

const googleIssuer = new URL("https://accounts.google.com");

let discoveryPromise: Promise<client.Configuration> | null = null;

/** Astro/Vite loads `.env` into `import.meta.env`; `process.env` is often empty in API routes. */
function readServerEnv(name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET"): string | undefined {
  const fromMeta = import.meta.env[name];
  if (typeof fromMeta === "string" && fromMeta.trim()) return fromMeta.trim();
  const fromProcess = process.env[name];
  if (typeof fromProcess === "string" && fromProcess.trim()) return fromProcess.trim();
  return undefined;
}

function requireGoogleEnv(): { clientId: string; clientSecret: string } {
  const clientId = readServerEnv("GOOGLE_CLIENT_ID");
  const clientSecret = readServerEnv("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }
  return { clientId, clientSecret };
}

export async function getGoogleOidcConfiguration(): Promise<client.Configuration> {
  const { clientId, clientSecret } = requireGoogleEnv();
  if (!discoveryPromise) {
    discoveryPromise = client.discovery(googleIssuer, clientId, clientSecret).catch((err) => {
      discoveryPromise = null; // Allow retry on transient failures
      throw err;
    });
  }
  return discoveryPromise;
}

export function getGoogleCallbackUrl(siteBaseUrl: string): string {
  const base = siteBaseUrl.replace(/\/$/, "");
  return `${base}/api/auth/google/callback`;
}

export async function buildGoogleAuthorizationRedirect(siteBaseUrl: string): Promise<{
  redirectTo: URL;
  state: string;
  codeVerifier: string;
}> {
  const config = await getGoogleOidcConfiguration();
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const redirectTo = client.buildAuthorizationUrl(config, {
    redirect_uri: getGoogleCallbackUrl(siteBaseUrl),
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  return { redirectTo, state, codeVerifier };
}

export async function completeGoogleAuthorizationCodeGrant(
  currentUrl: URL,
  checks: { pkceCodeVerifier: string; expectedState: string }
) {
  const config = await getGoogleOidcConfiguration();
  return client.authorizationCodeGrant(config, currentUrl, {
    pkceCodeVerifier: checks.pkceCodeVerifier,
    expectedState: checks.expectedState,
  });
}
