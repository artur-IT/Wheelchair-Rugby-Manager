import type { APIRoute } from "astro";
import { handleSuperTokensRequest } from "@/lib/supertokens/handleSuperTokensRequest";

export const prerender = false;

export const ALL: APIRoute = async ({ request, url }) => {
  // Handle before SuperTokens catch-all (Google redirect_uri GET is not an ST API route).
  if (request.method === "GET" && url.pathname === "/api/auth/callback/google") {
    const target = new URL(`/auth/callback${url.search}`, url.origin);
    return Response.redirect(target.toString(), 302);
  }
  return handleSuperTokensRequest(request);
};
