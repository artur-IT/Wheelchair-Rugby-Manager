import type { APIRoute } from "astro";
import { LoginBodySchema } from "@/lib/auth/schemas";
import { verifyPassword } from "@/lib/auth/password";
import { setAuthSessionCookies } from "@/lib/auth/sessionCookies";
import { prisma } from "@/lib/prisma";

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function parseLoginPayload(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await request.json();
    } catch {
      return null;
    }
  }
  try {
    const form = await request.formData();
    return {
      localLogin: String(form.get("localLogin") ?? ""),
      password: String(form.get("password") ?? ""),
    };
  } catch {
    return null;
  }
}

export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
  const wantsJson = request.headers.get("Accept") === "application/json";
  const raw = await parseLoginPayload(request);
  if (raw === null) {
    return wantsJson ? json({ ok: false }, 400) : redirect("/?login=1&error=1");
  }

  const parsed = LoginBodySchema.safeParse(raw);
  if (!parsed.success) {
    return wantsJson ? json({ ok: false, error: "Walidacja" }, 400) : redirect("/?login=1&error=1");
  }

  const { localLogin, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { authProvider: "LOCAL", localLogin },
    select: { id: true, role: true, passwordHash: true, mustResetPassword: true },
  });

  if (!user?.passwordHash) {
    const delay = () => new Promise((r) => setTimeout(r, 400));
    await delay();
    return wantsJson ? json({ ok: false }, 401) : redirect("/?login=1&error=1");
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    const delay = () => new Promise((r) => setTimeout(r, 400));
    await delay();
    return wantsJson ? json({ ok: false }, 401) : redirect("/?login=1&error=1");
  }

  setAuthSessionCookies(cookies, { userId: user.id, role: user.role, requestUrl: url });

  if (user.mustResetPassword) {
    return wantsJson ? json({ ok: true, mustResetPassword: true }) : redirect("/reset-password");
  }

  return wantsJson ? json({ ok: true, mustResetPassword: false }) : redirect("/dashboard");
};
