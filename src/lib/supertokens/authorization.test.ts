import { describe, expect, it, vi } from "vitest";
import UserRoles from "supertokens-node/recipe/userroles";
import {
  hasAnyRole,
  hasPermission,
  hasRole,
  requireAnyRole,
  requirePermission,
  requireRole,
} from "@/lib/supertokens/authorization";

vi.mock("supertokens-node/recipe/userroles", () => ({
  default: {
    getRolesForUser: vi.fn(),
    getPermissionsForRole: vi.fn(),
  },
}));

const identity = { tenantId: "public", userId: "user-1" };

describe("supertokens authorization helpers", () => {
  it("hasRole returns true for matched role", async () => {
    vi.mocked(UserRoles.getRolesForUser).mockResolvedValueOnce({ status: "OK", roles: ["ADMIN"] });
    await expect(hasRole(identity, "ADMIN")).resolves.toBe(true);
  });

  it("hasAnyRole returns false when no role matches", async () => {
    vi.mocked(UserRoles.getRolesForUser)
      .mockResolvedValueOnce({ status: "OK", roles: [] })
      .mockResolvedValueOnce({ status: "OK", roles: [] });
    await expect(hasAnyRole(identity, ["ADMIN", "COACH"])).resolves.toBe(false);
  });

  it("hasPermission returns true for matched permission", async () => {
    vi.mocked(UserRoles.getRolesForUser).mockResolvedValueOnce({ status: "OK", roles: ["ADMIN"] });
    vi.mocked(UserRoles.getPermissionsForRole).mockResolvedValueOnce({ status: "OK", permissions: ["club:write"] });
    await expect(hasPermission(identity, "club:write")).resolves.toBe(true);
  });

  it("requireRole returns 403 when role is missing", async () => {
    vi.mocked(UserRoles.getRolesForUser).mockResolvedValueOnce({ status: "OK", roles: ["COACH"] });
    const result = await requireRole(identity, "ADMIN");
    expect(result.ok).toBe(false);
    if (!("response" in result)) {
      throw new Error("Expected forbidden result");
    }
    expect(result.response.status).toBe(403);
  });

  it("requireAnyRole returns success when one role matches", async () => {
    vi.mocked(UserRoles.getRolesForUser)
      .mockResolvedValueOnce({ status: "OK", roles: ["COACH"] })
      .mockResolvedValueOnce({ status: "OK", roles: ["COACH"] });
    const result = await requireAnyRole(identity, ["ADMIN", "COACH"]);
    expect(result.ok).toBe(true);
  });

  it("requirePermission returns 403 when permission is missing", async () => {
    vi.mocked(UserRoles.getRolesForUser).mockResolvedValueOnce({ status: "OK", roles: ["COACH"] });
    vi.mocked(UserRoles.getPermissionsForRole).mockResolvedValueOnce({ status: "OK", permissions: ["club:read"] });
    const result = await requirePermission(identity, "club:write");
    expect(result.ok).toBe(false);
    if (!("response" in result)) {
      throw new Error("Expected forbidden result");
    }
    expect(result.response.status).toBe(403);
  });
});
