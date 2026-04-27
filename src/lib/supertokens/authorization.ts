import UserRoles from "supertokens-node/recipe/userroles";
import { json } from "@/lib/api";

export interface SessionIdentity {
  tenantId: string;
  userId: string;
}

interface AuthzSuccess {
  ok: true;
  identity: SessionIdentity;
}

interface AuthzFailure {
  ok: false;
  response: Response;
}

export type AuthzResult = AuthzSuccess | AuthzFailure;

const forbidden = () => ({ ok: false as const, response: json({ error: "Brak uprawnień" }, 403) });

/**
 * Central wrapper for SuperTokens role checks used by API authorization.
 */
export async function hasRole(identity: SessionIdentity, role: string): Promise<boolean> {
  const rolesResult = await UserRoles.getRolesForUser(identity.tenantId, identity.userId);
  return rolesResult.status === "OK" && rolesResult.roles.includes(role);
}

/**
 * Convenience helper for role unions like ADMIN/OWNER.
 */
export async function hasAnyRole(identity: SessionIdentity, roles: readonly string[]): Promise<boolean> {
  const rolesResult = await UserRoles.getRolesForUser(identity.tenantId, identity.userId);
  if (rolesResult.status !== "OK") {
    return false;
  }
  return roles.some((role) => rolesResult.roles.includes(role));
}

/**
 * Permission-based check to support gradual migration from role-only auth.
 */
export async function hasPermission(identity: SessionIdentity, permission: string): Promise<boolean> {
  const rolesResult = await UserRoles.getRolesForUser(identity.tenantId, identity.userId);
  if (rolesResult.status !== "OK") {
    return false;
  }

  for (const role of rolesResult.roles) {
    const permissionsResult = await UserRoles.getPermissionsForRole(role);
    if (permissionsResult.status === "OK" && permissionsResult.permissions.includes(permission)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns auth result object that can be returned directly from API route.
 */
export async function requireRole(identity: SessionIdentity, role: string): Promise<AuthzResult> {
  if (await hasRole(identity, role)) {
    return { ok: true, identity };
  }
  return forbidden();
}

/**
 * Returns auth result object for role union checks.
 */
export async function requireAnyRole(identity: SessionIdentity, roles: readonly string[]): Promise<AuthzResult> {
  if (await hasAnyRole(identity, roles)) {
    return { ok: true, identity };
  }
  return forbidden();
}

/**
 * Returns auth result object for permission checks.
 */
export async function requirePermission(identity: SessionIdentity, permission: string): Promise<AuthzResult> {
  if (await hasPermission(identity, permission)) {
    return { ok: true, identity };
  }
  return forbidden();
}
