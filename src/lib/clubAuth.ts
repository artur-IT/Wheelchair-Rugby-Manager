import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";
import { requireRole } from "@/lib/supertokens/authorization";
import { getSessionPrismaUser } from "@/lib/supertokens/sessionFromRequest";

interface RequesterIdentity {
  tenantId: string;
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

async function getRequesterIdentity(request: Request): Promise<AuthResult> {
  const sessionUser = await getSessionPrismaUser(request);
  if (!sessionUser) {
    return unauthorized();
  }

  return { ok: true, identity: { tenantId: sessionUser.tenantId, userId: sessionUser.userId } };
}

export async function authorizeClubAccess(request: Request, resourceClubId: string): Promise<AuthResult> {
  const auth = await getRequesterIdentity(request);
  if (!auth.ok) return auth;

  const { userId } = auth.identity;
  const adminAuth = await requireRole(auth.identity, "ADMIN");
  if (adminAuth.ok) return auth;

  const club = await prisma.club.findUnique({
    where: { id: resourceClubId },
    select: { ownerUserId: true },
  });
  if (club?.ownerUserId === userId) return auth;

  return forbidden();
}
