import { CollectingResponse, middleware } from "supertokens-node/framework/custom";
import { collectingResponseToResponse } from "@/lib/supertokens/collectingResponseToWeb";
import { ensureSuperTokensInitialized } from "@/lib/supertokens/initSuperTokens";
import { requestToPreParsedRequest } from "@/lib/supertokens/requestAdapter";

function logSuperTokensFailure(context: string, err: unknown): void {
  if (err instanceof Error) {
    console.error(`[SuperTokens] ${context}: ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  } else {
    console.error(`[SuperTokens] ${context}:`, err);
  }
}

/**
 * Run SuperTokens middleware for a single incoming Request (Astro API catch-all).
 */
export async function handleSuperTokensRequest(request: Request): Promise<Response> {
  try {
    ensureSuperTokensInitialized();
  } catch (err) {
    logSuperTokensFailure("init failed (check env: SUPERTOKENS_*, GOOGLE_*, DATABASE)", err);
    return new Response("Authentication service error", { status: 500 });
  }

  const stMiddleware = middleware();
  const req = requestToPreParsedRequest(request);
  const res = new CollectingResponse();

  try {
    const result = await stMiddleware(req, res);
    if ("error" in result && result.error) {
      logSuperTokensFailure(`middleware error for ${new URL(request.url).pathname}`, result.error);
      return new Response("Authentication service error", { status: 500 });
    }
    if (!result.handled) {
      return new Response("Not found", { status: 404 });
    }
    return collectingResponseToResponse(res);
  } catch (err) {
    logSuperTokensFailure(`unhandled exception for ${new URL(request.url).pathname}`, err);
    return new Response("Authentication service error", { status: 500 });
  }
}
