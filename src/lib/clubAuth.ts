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

function getRequesterIdentity(cookies: AstroCookies): AuthResult {
  const sessionValue = cookies.get("session")?.value;
  if (sessionValue !== "ok") {
    return unauthorized();
  }

  const userId = cookies.get("sessionUserId")?.value?.trim();
  if (!userId) {
    return unauthorized();
  }

  const role = cookies.get("sessionUserRole")?.value?.trim().toUpperCase();
  return { ok: true, identity: { role, userId } };
}

export async function authorizeClubAccess(cookies: AstroCookies, resourceClubId: string): Promise<AuthResult> {
  const auth = getRequesterIdentity(cookies);
  if (!auth.ok) return auth;

  const { role, userId } = auth.identity;
  if (role === "ADMIN") return auth;

  const club = await prisma.club.findUnique({
    where: { id: resourceClubId },
    select: { ownerUserId: true },
  });
  if (club?.ownerUserId === userId) return auth;

  return forbidden();
}
