import { createRequire } from "node:module";
import { UserRole } from "@prisma/client";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import Session from "supertokens-node/recipe/session";
import ThirdParty from "supertokens-node/recipe/thirdparty";
import SuperTokens from "supertokens-node";
import type { UserContext } from "supertokens-node/lib/build/types";
import { prisma } from "@/lib/prisma";
import { hashPassword, randomUnusedPasswordHash } from "@/lib/supertokens/password";
import { getGoogleClientId, getGoogleClientSecret, isProductionBuild } from "@/lib/supertokens/env";
import { validateAuthEmail, validateAuthPassword } from "@/lib/supertokens/authValidation";
import {
  computeFailedLoginState,
  computeRemainingLoginAttempts,
  isTemporarilyLocked,
  MAX_FAILED_LOGIN_ATTEMPTS,
} from "@/lib/supertokens/loginAttemptPolicy";
import Dashboard from "supertokens-node/recipe/dashboard";
import UserRoles from "supertokens-node/recipe/userroles";

// Load via require: Vite SSR turns `import Google from ".../google.js"` into a broken default interop
// ("default is not a function"). Node's require keeps the real CJS export.
type GoogleFactory = typeof import("supertokens-node/lib/build/recipe/thirdparty/providers/google.js").default;

const require = createRequire(import.meta.url);
const Google = require("supertokens-node/lib/build/recipe/thirdparty/providers/google.js").default as GoogleFactory;
const DEFAULT_APP_ROLE = "USER";
const ADMIN_APP_ROLE = "ADMIN";

function nameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  return local && local.length > 0 ? local : "User";
}

function toNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

type UnknownRecord = Record<string, unknown>;

const toRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === "object" ? (value as UnknownRecord) : null;

function pickFirstNonEmpty(source: UnknownRecord | null, keys: string[]): string | null {
  if (!source) {
    return null;
  }

  for (const key of keys) {
    const parsed = toNonEmptyString(source[key]);
    if (parsed) {
      return parsed;
    }
  }
  return null;
}

function parseNameParts(primary: UnknownRecord | null, fallback: UnknownRecord | null): string | null {
  const firstName =
    pickFirstNonEmpty(primary, ["given_name", "givenName"]) ?? pickFirstNonEmpty(fallback, ["given_name"]);
  const lastName =
    pickFirstNonEmpty(primary, ["family_name", "familyName"]) ?? pickFirstNonEmpty(fallback, ["family_name"]);

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return pickFirstNonEmpty(primary, ["name"]) ?? pickFirstNonEmpty(fallback, ["name"]);
}

function parseGoogleProfileName(rawUserInfoFromProvider: unknown): string | null {
  const provider = toRecord(rawUserInfoFromProvider);
  if (!provider) {
    return null;
  }

  const fromUserInfoAPI = toRecord(provider.fromUserInfoAPI);
  const userInfoApiPayload = toRecord(fromUserInfoAPI?.userInfo) ?? fromUserInfoAPI;
  const idTokenPayload = toRecord(provider.fromIdTokenPayload);

  return parseNameParts(userInfoApiPayload, idTokenPayload);
}

function parseGoogleProfileNameFromUserInfo(userInfo: unknown): string | null {
  return parseNameParts(toRecord(userInfo), null);
}

function shouldReplaceGeneratedName(currentName: string, email: string): boolean {
  const normalizedCurrentName = currentName.trim().toLowerCase();
  if (!normalizedCurrentName) {
    return true;
  }

  return normalizedCurrentName === nameFromEmail(email).trim().toLowerCase();
}

function getGoogleAccessToken(oAuthTokens: unknown): string | null {
  if (!oAuthTokens || typeof oAuthTokens !== "object") {
    return null;
  }
  const tokens = oAuthTokens as Record<string, unknown>;
  return toNonEmptyString(tokens.access_token) ?? toNonEmptyString(tokens.accessToken);
}

async function fetchGoogleUserInfo(accessToken: string): Promise<unknown> {
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as unknown;
  } catch {
    throw new Error("Failed to fetch Google user info");
  }
}

/** Postgres: match stored email even if DB row used different casing than normalized login input. */
function findUserByEmailInsensitive(emailLower: string) {
  return prisma.user.findFirst({
    where: { email: { equals: emailLower, mode: "insensitive" } },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      failedLoginAttempts: true,
      lockUntil: true,
      manualLock: true,
    },
  });
}

async function mapSuperTokensUserToPrismaUser(
  superTokensUserId: string,
  prismaUserId: string,
  userContext: UserContext
): Promise<void> {
  const res = await SuperTokens.createUserIdMapping({
    superTokensUserId,
    externalUserId: prismaUserId,
    userContext,
  });
  if (res.status === "USER_ID_MAPPING_ALREADY_EXISTS_ERROR") {
    return;
  }
}

async function ensureDefaultRoles(userContext: UserContext): Promise<void> {
  await UserRoles.createNewRoleOrAddPermissions(DEFAULT_APP_ROLE, [], userContext);
  await UserRoles.createNewRoleOrAddPermissions(ADMIN_APP_ROLE, [], userContext);
}

async function assignDefaultRole(tenantId: string, userId: string, userContext: UserContext): Promise<void> {
  await ensureDefaultRoles(userContext);
  const result = await UserRoles.addRoleToUser(tenantId, userId, DEFAULT_APP_ROLE, userContext);
  if (result.status === "UNKNOWN_ROLE_ERROR") {
    await UserRoles.createNewRoleOrAddPermissions(DEFAULT_APP_ROLE, [], userContext);
    await UserRoles.addRoleToUser(tenantId, userId, DEFAULT_APP_ROLE, userContext);
  }
}

export function buildRecipeList() {
  return [
    Session.init({
      antiCsrf: "NONE",
      cookieSameSite: "lax",
      cookieSecure: isProductionBuild(),
    }),
    Dashboard.init(),
    UserRoles.init(),
    EmailPassword.init({
      signUpFeature: {
        formFields: [
          {
            id: "email",
            validate: async (value) => validateAuthEmail(String(value ?? "")) ?? undefined,
          },
          {
            id: "password",
            validate: async (value) => validateAuthPassword(String(value ?? "")) ?? undefined,
          },
        ],
      },
      override: {
        functions: (original) => ({
          ...original,
          signUp: async (input) => {
            const email = input.email.trim().toLowerCase();
            const { password, tenantId, userContext } = input;

            const existing = await findUserByEmailInsensitive(email);
            if (existing) {
              return { status: "EMAIL_ALREADY_EXISTS_ERROR" as const };
            }

            const hashed = await hashPassword(password);
            const prismaUser = await prisma.user.create({
              data: {
                email,
                name: nameFromEmail(email),
                password: hashed,
                role: UserRole.USER,
              },
            });

            const created = await original.createNewRecipeUser({
              email,
              password,
              tenantId,
              userContext,
            });

            if (created.status !== "OK") {
              await prisma.user.delete({ where: { id: prismaUser.id } }).catch(() => undefined);
              return created;
            }

            await mapSuperTokensUserToPrismaUser(created.user.id, prismaUser.id, userContext);
            await assignDefaultRole(tenantId, created.user.id, userContext);
            const user = (await SuperTokens.getUser(created.user.id, userContext)) ?? created.user;
            return { status: "OK" as const, user, recipeUserId: created.recipeUserId };
          },
          signIn: async (input) => {
            const email = input.email.trim().toLowerCase();
            const { tenantId, userContext } = input;
            const loginStateUser = await findUserByEmailInsensitive(email);
            const now = new Date();

            if (loginStateUser?.manualLock) {
              return {
                status: "WRONG_CREDENTIALS_ERROR" as const,
                remainingAttempts: 0,
                maxAttempts: MAX_FAILED_LOGIN_ATTEMPTS,
              };
            }
            if (loginStateUser?.lockUntil && isTemporarilyLocked(loginStateUser.lockUntil, now)) {
              return {
                status: "WRONG_CREDENTIALS_ERROR" as const,
                remainingAttempts: 0,
                maxAttempts: MAX_FAILED_LOGIN_ATTEMPTS,
                lockUntil: loginStateUser.lockUntil.toISOString(),
              };
            }

            const superTokensResult = await original.signIn({
              ...input,
              email,
            });
            if (superTokensResult.status !== "OK") {
              if (
                superTokensResult.status === "WRONG_CREDENTIALS_ERROR" &&
                loginStateUser &&
                !loginStateUser.manualLock
              ) {
                const nextState = computeFailedLoginState(loginStateUser.failedLoginAttempts, now);
                await prisma.user
                  .update({
                    where: { id: loginStateUser.id },
                    data: nextState,
                  })
                  .catch(() => undefined);
                return {
                  ...superTokensResult,
                  remainingAttempts: computeRemainingLoginAttempts(nextState.failedLoginAttempts),
                  maxAttempts: MAX_FAILED_LOGIN_ATTEMPTS,
                  lockUntil: nextState.lockUntil ? nextState.lockUntil.toISOString() : null,
                } as typeof superTokensResult;
              }
              return superTokensResult;
            }

            if (
              loginStateUser &&
              !loginStateUser.manualLock &&
              (loginStateUser.failedLoginAttempts > 0 || loginStateUser.lockUntil !== null)
            ) {
              await prisma.user.update({
                where: { id: loginStateUser.id },
                data: {
                  failedLoginAttempts: 0,
                  lockUntil: null,
                },
              });
            }

            // Legacy migration: after successful SuperTokens login, backfill Prisma mapping if needed.
            const mapped = await SuperTokens.getUserIdMapping({
              userId: superTokensResult.user.id,
              userContext,
            });
            if (!mapped) {
              const prismaUser = await findUserByEmailInsensitive(email);
              if (prismaUser) {
                await mapSuperTokensUserToPrismaUser(superTokensResult.user.id, prismaUser.id, userContext);
              }
            }
            await assignDefaultRole(tenantId, superTokensResult.user.id, userContext);
            return superTokensResult;
          },
          consumePasswordResetToken: async (input) => {
            const result = await original.consumePasswordResetToken(input);
            if (result.status !== "OK") {
              return result;
            }

            // Keep Prisma lock state aligned with SuperTokens after successful reset.
            const mapping = await SuperTokens.getUserIdMapping({
              userId: result.userId,
              userContext: input.userContext,
            });
            if (mapping.status === "OK") {
              await prisma.user
                .updateMany({
                  where: { id: mapping.externalUserId, manualLock: false },
                  data: {
                    failedLoginAttempts: 0,
                    lockUntil: null,
                  },
                })
                .catch(() => undefined);
              return result;
            }

            const stUser = await SuperTokens.getUser(result.userId, input.userContext);
            const stEmail = stUser?.emails?.[0]?.trim().toLowerCase();
            if (!stEmail) {
              return result;
            }
            await prisma.user
              .updateMany({
                where: {
                  email: { equals: stEmail, mode: "insensitive" },
                  manualLock: false,
                },
                data: {
                  failedLoginAttempts: 0,
                  lockUntil: null,
                },
              })
              .catch(() => undefined);
            return result;
          },
        }),
      },
    }),
    ThirdParty.init({
      signInAndUpFeature: {
        providers: [
          Google({
            config: {
              thirdPartyId: "google",
              clients: [
                {
                  clientType: "web",
                  clientId: getGoogleClientId(),
                  clientSecret: getGoogleClientSecret(),
                  scope: ["openid", "email", "profile"],
                },
              ],
            },
          }),
        ],
      },
      override: {
        functions: (original) => ({
          ...original,
          signInUp: async (input) => {
            const email = input.email.trim().toLowerCase();
            const existingPrismaUser = await findUserByEmailInsensitive(email);
            const result = await original.signInUp(input);
            if (result.status !== "OK") {
              return result;
            }
            if (!email) {
              return result;
            }

            // Block cross-provider takeover: if Google just created a new recipe user but
            // this email is already used by another account in our DB, cancel the new user.
            if (result.createdNewRecipeUser && existingPrismaUser) {
              await SuperTokens.deleteUser(result.user.id).catch(() => undefined);
              return {
                status: "SIGN_IN_UP_NOT_ALLOWED" as const,
                reason: "Konto z tym adresem e-mail już istnieje.",
              };
            }

            let prismaUser = existingPrismaUser;
            let googleProfileName = parseGoogleProfileName(input.rawUserInfoFromProvider);
            if (!googleProfileName) {
              const signInInput = input as Record<string, unknown>;
              const accessToken = getGoogleAccessToken(signInInput.oAuthTokens);
              const userInfo = accessToken ? await fetchGoogleUserInfo(accessToken).catch(() => null) : null;
              googleProfileName = parseGoogleProfileNameFromUserInfo(userInfo);
            }
            if (!prismaUser) {
              const placeholder = await randomUnusedPasswordHash();
              prismaUser = await prisma.user.create({
                data: {
                  email,
                  name: googleProfileName ?? nameFromEmail(email),
                  password: placeholder,
                  role: UserRole.USER,
                },
              });
            } else if (googleProfileName && shouldReplaceGeneratedName(prismaUser.name, email)) {
              await prisma.user.update({
                where: { id: prismaUser.id },
                data: { name: googleProfileName },
              });
            }
            await mapSuperTokensUserToPrismaUser(result.user.id, prismaUser.id, input.userContext);
            await assignDefaultRole(input.tenantId, result.user.id, input.userContext);
            return result;
          },
        }),
      },
    }),
  ];
}
