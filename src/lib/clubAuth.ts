import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

interface RequesterIdentity {
  role?: string;
  userId?: string;
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

function getRequesterIdentity(request: Request, sessionValue?: string): AuthResult {
  if (sessionValue !== "ok") {
    return unauthorized();
  }

  const role = request.headers.get("x-user-role")?.trim().toUpperCase();
  const userId = request.headers.get("x-owner-user-id")?.trim();

  if (role !== "ADMIN" && !userId) {
    return unauthorized();
  }

  return { ok: true, identity: { role, userId } };
}

export async function authorizeClubAccess(
  request: Request,
  sessionValue: string | undefined,
  resourceClubId: string
): Promise<AuthResult> {
  const auth = getRequesterIdentity(request, sessionValue);
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
