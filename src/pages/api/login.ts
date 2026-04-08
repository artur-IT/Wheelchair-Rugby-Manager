import type { APIRoute } from "astro";
import { prisma } from "@/lib/prisma";

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const wantsJson = request.headers.get("Accept") === "application/json";
  if (!email || !password) return wantsJson ? json({ ok: false }, 401) : redirect("/?login=1&error=1");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, password: true },
  });
  if (!user || user.password !== password) {
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
  cookies.set("sessionUserId", user.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    maxAge: 60 * 60 * 24 * 7,
  });
  cookies.set("sessionUserRole", user.role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    maxAge: 60 * 60 * 24 * 7,
  });

  return wantsJson ? json({ ok: true }) : redirect("/dashboard");
};
