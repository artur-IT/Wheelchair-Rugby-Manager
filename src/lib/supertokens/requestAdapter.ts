import { PreParsedRequest } from "supertokens-node/framework/custom";

function parseCookieHeader(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    try {
      out[name] = decodeURIComponent(value);
    } catch {
      out[name] = value;
    }
  }
  return out;
}

function queryRecordFromUrl(url: URL): Record<string, string> {
  const q: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    q[key] = value;
  });
  return q;
}

/**
 * Build SuperTokens PreParsedRequest from a standard Web Request (Astro API).
 */
export function requestToPreParsedRequest(request: Request): PreParsedRequest {
  const url = new URL(request.url);
  const fullUrl = `${url.origin}${url.pathname}${url.search}`;

  return new PreParsedRequest({
    url: fullUrl,
    // SuperTokens normalises the method string internally.
    method: request.method.toUpperCase() as never,
    headers: request.headers,
    query: queryRecordFromUrl(url),
    cookies: parseCookieHeader(request.headers.get("cookie")),
    getJSONBody: async () => {
      const ct = request.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        return {};
      }
      try {
        return await request.clone().json();
      } catch {
        return {};
      }
    },
    getFormBody: async () => {
      const ct = request.headers.get("content-type") ?? "";
      if (!ct.includes("application/x-www-form-urlencoded") && !ct.includes("multipart/form-data")) {
        return {};
      }
      try {
        const fd = await request.clone().formData();
        const obj: Record<string, string> = {};
        fd.forEach((value, key) => {
          if (typeof value === "string") {
            obj[key] = value;
          }
        });
        return obj;
      } catch {
        return {};
      }
    },
  });
}
