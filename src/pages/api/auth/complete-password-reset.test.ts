import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("new-hash"),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

let POST: (ctx: unknown) => Promise<Response>;

function cookies(sessionOk: boolean, userId: string | null) {
  return {
    get: vi.fn((name: string) => {
      if (name === "session") return sessionOk ? { value: "ok" } : undefined;
      if (name === "sessionUserId") return userId ? { value: userId } : undefined;
      return undefined;
    }),
  } as never;
}

beforeAll(async () => {
  const mod = await import("@/pages/api/auth/complete-password-reset");
  POST = mod.POST as unknown as (ctx: unknown) => Promise<Response>;
});

describe("POST /api/auth/complete-password-reset", () => {
  it("returns 401 without session", async () => {
    const res = await POST({
      request: new Request("http://localhost/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "password1" }),
      }),
      cookies: cookies(false, "u1"),
    } as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when reset not required", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ mustResetPassword: false } as never);

    const res = await POST({
      request: new Request("http://localhost/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "password1" }),
      }),
      cookies: cookies(true, "u1"),
    } as never);
    expect(res.status).toBe(400);
  });

  it("updates password when reset required", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ mustResetPassword: true } as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never);

    const res = await POST({
      request: new Request("http://localhost/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "password1" }),
      }),
      cookies: cookies(true, "u1"),
    } as never);
    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.user.update)).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { passwordHash: "new-hash", mustResetPassword: false },
    });
  });
});
