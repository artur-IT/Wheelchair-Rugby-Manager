import { CollectingResponse } from "supertokens-node/framework/custom";
import Session from "supertokens-node/recipe/session";
import { prisma } from "@/lib/prisma";
import { ensureSuperTokensInitialized } from "@/lib/supertokens/initSuperTokens";
import { requestToPreParsedRequest } from "@/lib/supertokens/requestAdapter";

export interface SessionPrismaUser {
  userId: string;
  tenantId: string;
}

/**
 * Resolve the logged-in Prisma user from SuperTokens session cookies on the request.
 */
export async function getSessionPrismaUser(request: Request): Promise<SessionPrismaUser | null> {
  ensureSuperTokensInitialized();
  const req = requestToPreParsedRequest(request);
  const res = new CollectingResponse();
  try {
    const session = await Session.getSession(req, res, { sessionRequired: false });
    if (!session) {
      return null;
    }
    const userId = session.getUserId();
    const tenantId = session.getTenantId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return null;
    }
    return { userId: user.id, tenantId };
  } catch {
    return null;
  }
}
