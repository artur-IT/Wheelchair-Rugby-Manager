import type { APIRoute } from "astro";

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
  const form = await request.formData();
  const pin = String(form.get("pin") ?? "");
  const wantsJson = request.headers.get("Accept") === "application/json";

  // MVP: hardcoded PIN (later: move to .env)
  const APP_PIN = "1";

  if (pin !== APP_PIN) {
    return wantsJson ? json({ ok: false }, 401) : redirect("/?login=1&error=1");
  }

  // In dev you often run on http://localhost, so secure cookies would not be stored.
  // In prod (https) secure cookies should be enabled.
  const isSecure = url.protocol === "https:" || import.meta.env.PROD;

  cookies.set("session", "ok", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return wantsJson ? json({ ok: true }) : redirect("/dashboard");
};
