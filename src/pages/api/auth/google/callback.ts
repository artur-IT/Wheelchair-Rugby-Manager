import type { APIRoute } from "astro";
import { completeGoogleAuthorizationCodeGrant } from "@/lib/auth/googleOidc";
import { clearOAuthPkcCookies, setAuthSessionCookies } from "@/lib/auth/sessionCookies";
import { prisma } from "@/lib/prisma";

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  const expectedState = cookies.get("google_oauth_state")?.value;
  const codeVerifier = cookies.get("google_oauth_verifier")?.value;
  if (!expectedState || !codeVerifier) {
    return redirect("/?login=1&oauth_error=session");
  }

  try {
    const tokens = await completeGoogleAuthorizationCodeGrant(url, {
      expectedState,
      pkceCodeVerifier: codeVerifier,
    });
    clearOAuthPkcCookies(cookies, url);

    const claims = tokens.claims();
    const sub = claims?.sub;
    if (typeof sub !== "string" || !sub) {
      clearOAuthPkcCookies(cookies, url);
      return redirect("/?login=1&oauth_error=claims");
    }

    const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : null;
    const displayName =
      typeof claims.name === "string" && claims.name.trim().length > 0
        ? claims.name.trim()
        : (email ?? "Użytkownik Google");

    let user = await prisma.user.findUnique({ where: { googleSub: sub }, select: { id: true, role: true } });
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            name: displayName,
            email,
            passwordHash: null,
            mustResetPassword: false,
            authProvider: "GOOGLE",
            localLogin: null,
            googleSub: sub,
            role: "ADMIN",
          },
          select: { id: true, role: true },
        });
      } catch (error) {
        const unique =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code: string }).code === "P2002";
        if (unique) {
          return redirect("/?login=1&oauth_error=email");
        }
        throw error;
      }
    }

    setAuthSessionCookies(cookies, { userId: user.id, role: user.role, requestUrl: url });
    return redirect("/dashboard");
  } catch {
    clearOAuthPkcCookies(cookies, url);
    return redirect("/?login=1&oauth_error=grant");
  }
};
