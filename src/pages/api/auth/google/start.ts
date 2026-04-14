import type { APIRoute } from "astro";
import { buildGoogleAuthorizationRedirect } from "@/lib/auth/googleOidc";
import { getPublicSiteUrl } from "@/lib/auth/siteUrl";

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  const isSecure = url.protocol === "https:" || import.meta.env.PROD;
  const cookieBase = { path: "/", httpOnly: true, sameSite: "lax" as const, secure: isSecure, maxAge: 600 };

  try {
    const siteBase = getPublicSiteUrl(url);
    const { redirectTo, state, codeVerifier } = await buildGoogleAuthorizationRedirect(siteBase);
    cookies.set("google_oauth_state", state, cookieBase);
    cookies.set("google_oauth_verifier", codeVerifier, cookieBase);
    return redirect(redirectTo.toString());
  } catch (error) {
    console.error("[Google OAuth] Failed to start authorization flow:", error);
    return redirect("/?login=1&oauth=error");
  }
};
