import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSessionPrismaUser } from "@/lib/supertokens/sessionFromRequest";
import { z } from "@/lib/zodPl";
import { requiredFirstNameSchema, requiredLastNameSchema, toTitleCase } from "@/lib/validateInputs";
import SuperTokens from "supertokens-node";
import UserMetadata from "supertokens-node/recipe/usermetadata";

const UpdateCurrentUserSchema = z.object({
  firstName: requiredFirstNameSchema,
  lastName: requiredLastNameSchema,
});

function splitName(name: string): { firstName: string; lastName: string } {
  const normalized = name.trim().replace(/\s+/g, " ");
  const [firstName, ...rest] = normalized.split(" ");
  const lastName = rest.join(" ");
  return {
    firstName: firstName || "",
    lastName: lastName || "",
  };
}

async function resolveSuperTokensUserId(prismaUserId: string, tenantId: string, email: string): Promise<string | null> {
  const mapping = await SuperTokens.getUserIdMapping({ userId: prismaUserId });
  if (mapping.status === "OK") {
    return mapping.superTokensUserId;
  }

  const usersByEmail = await SuperTokens.listUsersByAccountInfo(tenantId, { email });
  const fallbackUser = usersByEmail[0];
  if (!fallbackUser) {
    // eslint-disable-next-line no-console
    console.warn("[profile-metadata-sync] Missing user id mapping and fallback user by email not found", {
      prismaUserId,
      tenantId,
      email,
    });
    return null;
  }

  await SuperTokens.createUserIdMapping({
    superTokensUserId: fallbackUser.id,
    externalUserId: prismaUserId,
    force: false,
  }).catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.warn("[profile-metadata-sync] Could not backfill user id mapping", {
      prismaUserId,
      superTokensUserId: fallbackUser.id,
      error,
    });
  });

  return fallbackUser.id;
}

export const GET: APIRoute = async ({ request }) => {
  const sessionUser = await getSessionPrismaUser(request);
  if (!sessionUser) return json({ error: "Brak aktywnej sesji użytkownika" }, 401);

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.userId },
    select: { name: true, email: true },
  });
  if (!user) return json({ error: "Użytkownik nie istnieje" }, 404);

  const { firstName, lastName } = splitName(user.name);
  return json({ firstName, lastName, email: user.email });
};

export const PUT: APIRoute = async ({ request }) => {
  const sessionUser = await getSessionPrismaUser(request);
  if (!sessionUser) return json({ error: "Brak aktywnej sesji użytkownika" }, 401);

  const body = await request.json().catch(() => null);
  const parsed = UpdateCurrentUserSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const firstName = toTitleCase(parsed.data.firstName);
  const lastName = toTitleCase(parsed.data.lastName);
  const name = `${firstName} ${lastName}`;

  const updatedUser = await prisma.user.update({
    where: { id: sessionUser.userId },
    data: { name },
    select: { email: true },
  });

  // Optional sync: save profile names in SuperTokens metadata when both fields are provided.
  // Keep Prisma as source of truth and do not fail profile save if metadata sync fails.
  if (firstName && lastName) {
    const superTokensUserId = await resolveSuperTokensUserId(
      sessionUser.userId,
      sessionUser.tenantId,
      updatedUser.email
    );
    if (superTokensUserId) {
      await UserMetadata.updateUserMetadata(superTokensUserId, {
        firstName,
        lastName,
      }).catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.warn("[profile-metadata-sync] Failed to update SuperTokens metadata", {
          prismaUserId: sessionUser.userId,
          superTokensUserId,
          error,
        });
      });
    }
  }

  return json({ firstName, lastName, email: updatedUser.email });
};
