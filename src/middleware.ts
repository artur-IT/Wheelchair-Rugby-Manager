import { defineMiddleware } from "astro:middleware";
import { CollectingResponse } from "supertokens-node/framework/custom";
import Session from "supertokens-node/recipe/session";
import { mergeCollectingResponseCookies } from "@/lib/supertokens/collectingResponseToWeb";
import { ensureSuperTokensInitialized } from "@/lib/supertokens/initSuperTokens";
import { requestToPreParsedRequest } from "@/lib/supertokens/requestAdapter";

const PUBLIC_PATHS = new Set(["/", "/auth/callback"]);

function isPublicAuthApi(pathname: string) {
  return pathname.startsWith("/api/auth");
}

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

async function readSuperTokensSession(request: Request): Promise<{ ok: boolean; collecting: CollectingResponse }> {
  ensureSuperTokensInitialized();
  const req = requestToPreParsedRequest(request);
  const collecting = new CollectingResponse();
  try {
    const session = await Session.getSession(req, collecting, { sessionRequired: false });
    return { ok: !!session, collecting };
  } catch {
    return { ok: false, collecting };
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect, request } = context;

  if (PUBLIC_PATHS.has(url.pathname) || isPublicAuthApi(url.pathname) || isLikelyAssetPath(url.pathname)) {
    return next();
  }

  const { ok, collecting } = await readSuperTokensSession(request);
  if (!ok) {
    if (url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Brak autoryzacji" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return redirect("/?login=1");
  }

  const response = await next();
  if (response instanceof Response) {
    return mergeCollectingResponseCookies(response, collecting);
  }
  return response;
});
