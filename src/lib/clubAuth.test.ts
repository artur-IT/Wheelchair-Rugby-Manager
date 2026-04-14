import { beforeEach, describe, expect, it, vi } from "vitest";

import { authorizeClubAccess } from "@/lib/clubAuth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    club: {
      findUnique: vi.fn(),
    },
  },
}));

function mockCookies(session: string | undefined, userId: string | undefined, role?: string) {
  return {
    get: vi.fn((name: string) => {
      if (name === "session") return session ? { value: session } : undefined;
      if (name === "sessionUserId") return userId ? { value: userId } : undefined;
      if (name === "sessionUserRole") return role ? { value: role } : undefined;
      return undefined;
    }),
  } as never;
}

describe("authorizeClubAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session cookie", async () => {
    const res = await authorizeClubAccess(mockCookies(undefined, "u1"), "club-1");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(401);
  });

  it("returns 401 when user id missing", async () => {
    const res = await authorizeClubAccess(mockCookies("ok", undefined), "club-1");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(401);
  });

  it("returns 401 when user no longer exists", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const res = await authorizeClubAccess(mockCookies("ok", "ghost"), "club-1");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(401);
  });

  it("returns 403 when user must reset password before using the app", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "u1",
      role: "ADMIN",
      mustResetPassword: true,
    } as never);

    const res = await authorizeClubAccess(mockCookies("ok", "u1", "ADMIN"), "club-1");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(403);
  });

  it("returns 403 when user is not club owner (no role bypass)", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "u2", role: "ADMIN", mustResetPassword: false } as never);
    vi.mocked(prisma.club.findUnique).mockResolvedValueOnce({ ownerUserId: "u1" } as never);

    const res = await authorizeClubAccess(mockCookies("ok", "u2", "ADMIN"), "club-1");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(403);
  });

  it("returns success when user owns the club", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "u1", role: "ADMIN", mustResetPassword: false } as never);
    vi.mocked(prisma.club.findUnique).mockResolvedValueOnce({ ownerUserId: "u1" } as never);

    const res = await authorizeClubAccess(mockCookies("ok", "u1", "ADMIN"), "club-1");
    expect(res.ok).toBe(true);
  });
});
