import { serialize, type CookieSerializeOptions } from "cookie";
import { CollectingResponse } from "supertokens-node/framework/custom";

function appendSetCookieHeaders(target: Headers, collecting: CollectingResponse): void {
  for (const c of collecting.cookies) {
    const opts: CookieSerializeOptions = {
      path: c.path,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite,
    };
    if (c.domain) opts.domain = c.domain;
    if (c.expires > 0) opts.expires = new Date(c.expires);
    target.append("Set-Cookie", serialize(c.key, c.value, opts));
  }
}

/**
 * Append Set-Cookie headers from a SuperTokens response onto an existing Response (e.g. after Session.getSession refresh).
 */
export function mergeCollectingResponseCookies(base: Response, collecting: CollectingResponse): Response {
  const headers = new Headers(base.headers);
  appendSetCookieHeaders(headers, collecting);
  return new Response(base.body, { status: base.status, statusText: base.statusText, headers });
}

/**
 * Turn SuperTokens CollectingResponse into a Web API Response for Astro.
 */
export function collectingResponseToResponse(collecting: CollectingResponse): Response {
  const headers = new Headers();
  collecting.headers.forEach((value, key) => {
    headers.append(key, value);
  });
  appendSetCookieHeaders(headers, collecting);

  const body = collecting.body ?? null;
  return new Response(body, { status: collecting.statusCode, headers });
}
