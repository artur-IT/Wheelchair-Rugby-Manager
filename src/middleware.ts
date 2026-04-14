import { defineMiddleware } from "astro:middleware";
import { isPasswordResetExemptPath } from "@/lib/auth/passwordResetGate";
import { prisma } from "@/lib/prisma";

const PUBLIC_PATHS = new Set([
  "/",
  "/register",
  "/reset-password",
  "/api/login",
  "/api/logout",
  "/api/register",
  "/api/auth/google/start",
  "/api/auth/google/callback",
  "/api/auth/password-reset-status",
  "/api/auth/initial-local-password",
]);

function isLikelyAssetPath(pathname: string) {
  return (
    pathname.startsWith("/_astro/") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".map") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".ico")
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  if (PUBLIC_PATHS.has(url.pathname) || isLikelyAssetPath(url.pathname)) {
    return next();
  }

  const session = cookies.get("session")?.value;
  if (!session) {
    return redirect("/?login=1");
  }

  const userId = cookies.get("sessionUserId")?.value?.trim();
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mustResetPassword: true },
    });
    if (user?.mustResetPassword && !isPasswordResetExemptPath(url.pathname)) {
      return redirect("/reset-password");
    }
  }

  return next();
});
