import type { AstroCookies } from "astro";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";

interface RequesterIdentity {
  role?: string;
  userId: string;
}

interface AuthSuccess {
  ok: true;
  identity: RequesterIdentity;
}

interface AuthFailure {
  ok: false;
  response: Response;
}

type AuthResult = AuthSuccess | AuthFailure;

const unauthorized = () => ({ ok: false as const, response: json({ error: "Brak autoryzacji" }, 401) });
const forbidden = () => ({ ok: false as const, response: json({ error: "Brak uprawnień" }, 403) });

export async function getRequesterIdentity(cookies: AstroCookies): Promise<AuthResult> {
  const sessionValue = cookies.get("session")?.value;
  if (sessionValue !== "ok") {
    return unauthorized();
  }

  const userId = cookies.get("sessionUserId")?.value?.trim();
  if (!userId) {
    return unauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, mustResetPassword: true },
  });
  if (!user) {
    return unauthorized();
  }

  if (user.mustResetPassword) {
    return {
      ok: false as const,
      response: json({ error: "Wymagana zmiana hasła.", code: "PASSWORD_RESET_REQUIRED" }, 403),
    };
  }

  const role = user.role;
  return { ok: true, identity: { role, userId: user.id } };
}

export async function authorizeClubAccess(cookies: AstroCookies, resourceClubId: string): Promise<AuthResult> {
  const auth = await getRequesterIdentity(cookies);
  if (!auth.ok) return auth;

  const { userId } = auth.identity;

  const club = await prisma.club.findUnique({
    where: { id: resourceClubId },
    select: { ownerUserId: true },
  });
  if (club?.ownerUserId === userId) return auth;

  return forbidden();
}
