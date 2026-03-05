import { defineMiddleware } from "astro:middleware";

const PUBLIC_PATHS = new Set(["/", "/api/login", "/api/logout"]);

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

  return next();
});
