/**
 * One-way sync: SuperTokens users → Prisma `User` rows + SuperTokens user-id mapping.
 *
 * What it does:
 * - Loads all SuperTokens users for a tenant (default `public`) via paginated Core API.
 * - Picks a canonical email from each user (`emails[]` or `loginMethods[].email`).
 * - If there is no user-id mapping yet: finds or creates a Prisma `User` for that email
 *   (new rows use a random Argon2 placeholder password, same pattern as Google-only users).
 * - Calls `createUserIdMapping` so `session.getUserId()` resolves to Prisma `User.id`.
 * - Ensures the SuperTokens app role `USER` exists (same helper behaviour as sign-up / OAuth).
 *
 * When to run: one-off after importing legacy SuperTokens data, or when some accounts never
 * hit your EmailPassword `signUp` / ThirdParty callback but already exist in SuperTokens.
 *
 * Environment: use the same variables as the Astro server — `DATABASE_URL`,
 * `SUPERTOKENS_CONNECTION_URI`, `PUBLIC_SITE_URL`, and `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
 * (full `ensureSuperTokensInitialized()` matches production init, including ThirdParty config).
 *
 * Optional: `SUPERTOKENS_TENANT_ID` (default `public`), `SYNC_ST_PAGE_LIMIT` (default `100`).
 *
 * How to run from repo root:
 *   pnpm run sync:st-prisma
 *
 * Or:
 *   pnpm exec tsx scripts/sync_supertokens-prisma.ts
 */

import "dotenv/config";
import { UserRole } from "@prisma/client";
import SuperTokens from "supertokens-node";
import UserRoles from "supertokens-node/recipe/userroles";

import { prisma } from "@/lib/prisma";
import { ensureSuperTokensInitialized } from "@/lib/supertokens/initSuperTokens";
import { randomUnusedPasswordHash } from "@/lib/supertokens/password";

const DEFAULT_APP_ROLE = "USER";
const ADMIN_APP_ROLE = "ADMIN";

const tenantId = process.env.SUPERTOKENS_TENANT_ID?.trim() || "public";
const userContext: Record<string, unknown> = {};
const pageLimit = Math.min(500, Math.max(1, Number(process.env.SYNC_ST_PAGE_LIMIT ?? "100") || 100));

function nameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  return local && local.length > 0 ? local : "User";
}

function pickCanonicalEmail(user: {
  emails?: string[];
  loginMethods?: { email?: string | undefined }[];
}): string | null {
  const list = user.emails?.map((e) => e.trim().toLowerCase()).filter(Boolean) ?? [];
  if (list.length > 0) {
    return list[0];
  }
  for (const m of user.loginMethods ?? []) {
    const e = m.email?.trim().toLowerCase();
    if (e) return e;
  }
  return null;
}

function findUserByEmailInsensitive(emailLower: string) {
  return prisma.user.findFirst({
    where: { email: { equals: emailLower, mode: "insensitive" } },
    select: { id: true, email: true },
  });
}

async function ensureDefaultRoles(): Promise<void> {
  await UserRoles.createNewRoleOrAddPermissions(DEFAULT_APP_ROLE, [], userContext);
  await UserRoles.createNewRoleOrAddPermissions(ADMIN_APP_ROLE, [], userContext);
}

async function assignDefaultRole(superTokensUserId: string): Promise<void> {
  await ensureDefaultRoles();
  const result = await UserRoles.addRoleToUser(tenantId, superTokensUserId, DEFAULT_APP_ROLE, userContext);
  if (result.status === "UNKNOWN_ROLE_ERROR") {
    await UserRoles.createNewRoleOrAddPermissions(DEFAULT_APP_ROLE, [], userContext);
    await UserRoles.addRoleToUser(tenantId, superTokensUserId, DEFAULT_APP_ROLE, userContext);
  }
}

async function mapSuperTokensUserToPrismaUser(superTokensUserId: string, prismaUserId: string): Promise<void> {
  const res = await SuperTokens.createUserIdMapping({
    superTokensUserId,
    externalUserId: prismaUserId,
    userContext,
  });
  if (res.status === "USER_ID_MAPPING_ALREADY_EXISTS_ERROR") {
    return;
  }
  if (res.status !== "OK") {
    throw new Error(`createUserIdMapping failed for ${superTokensUserId}: ${JSON.stringify(res)}`);
  }
}

type SyncOutcome =
  | "linked_existing_prisma"
  | "created_prisma"
  | "recreated_orphan_prisma"
  | "skipped_no_email"
  | "already_ok"
  | "orphan_mapping";

async function syncOneUser(stUser: {
  id: string;
  emails?: string[];
  loginMethods?: { email?: string | undefined }[];
}): Promise<SyncOutcome> {
  const email = pickCanonicalEmail(stUser);
  if (!email) {
    return "skipped_no_email";
  }

  const mapping = await SuperTokens.getUserIdMapping({ userId: stUser.id, userContext });
  if (mapping.status === "OK") {
    const prismaRow = await prisma.user.findUnique({ where: { id: mapping.externalUserId } });
    if (!prismaRow) {
      const existingByEmail = await findUserByEmailInsensitive(email);
      if (existingByEmail && existingByEmail.id !== mapping.externalUserId) {
        // eslint-disable-next-line no-console -- CLI script
        console.warn(
          `[sync] SuperTokens user ${stUser.id} maps to missing Prisma id ${mapping.externalUserId}, but email ${email} is already used by Prisma id ${existingByEmail.id} — fix manually.`
        );
        return "orphan_mapping";
      }

      const placeholder = await randomUnusedPasswordHash();
      await prisma.user.create({
        data: {
          id: mapping.externalUserId,
          email,
          name: nameFromEmail(email),
          password: placeholder,
          role: UserRole.USER,
        },
        select: { id: true },
      });

      await assignDefaultRole(stUser.id);
      return "recreated_orphan_prisma";
    }
    await assignDefaultRole(stUser.id);
    return "already_ok";
  }

  let prismaUser = await findUserByEmailInsensitive(email);
  let createdPrisma = false;
  if (!prismaUser) {
    const placeholder = await randomUnusedPasswordHash();
    prismaUser = await prisma.user.create({
      data: {
        email,
        name: nameFromEmail(email),
        password: placeholder,
        role: UserRole.USER,
      },
      select: { id: true, email: true },
    });
    createdPrisma = true;
  }

  await mapSuperTokensUserToPrismaUser(stUser.id, prismaUser.id);
  await assignDefaultRole(stUser.id);
  return createdPrisma ? "created_prisma" : "linked_existing_prisma";
}

async function main(): Promise<void> {
  ensureSuperTokensInitialized();

  let paginationToken: string | undefined;
  const tallies: Record<SyncOutcome | "pages" | "users_seen", number> = {
    pages: 0,
    users_seen: 0,
    linked_existing_prisma: 0,
    created_prisma: 0,
    recreated_orphan_prisma: 0,
    skipped_no_email: 0,
    already_ok: 0,
    orphan_mapping: 0,
  };

  for (;;) {
    const batch = await SuperTokens.getUsersOldestFirst({
      tenantId,
      limit: pageLimit,
      paginationToken,
      userContext,
    });
    tallies.pages += 1;
    const { users, nextPaginationToken } = batch;

    for (const u of users) {
      tallies.users_seen += 1;
      const outcome = await syncOneUser(u);
      tallies[outcome] += 1;
    }

    if (!nextPaginationToken) {
      break;
    }
    paginationToken = nextPaginationToken;
  }

  // eslint-disable-next-line no-console -- CLI script
  console.log("[sync] SuperTokens ↔ Prisma finished.", tallies);
}

await main()
  .catch((e: unknown) => {
    // eslint-disable-next-line no-console -- CLI script
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
