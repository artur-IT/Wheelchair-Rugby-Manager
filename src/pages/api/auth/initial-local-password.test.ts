import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("new-hash"),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

let POST: (ctx: unknown) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/pages/api/auth/initial-local-password");
  POST = mod.POST as unknown as (ctx: unknown) => Promise<Response>;
});

describe("POST /api/auth/initial-local-password", () => {
  it("returns 400 when JSON invalid", async () => {
    const res = await POST({
      request: new Request("http://localhost/api", { method: "POST", body: "{" }),
    } as never);
    expect(res.status).toBe(400);
  });

  it("returns 404 when no matching migrated user", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

    const res = await POST({
      request: new Request("http://localhost/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localLogin: "abc12", password: "password1" }),
      }),
    } as never);
    expect(res.status).toBe(404);
  });

  it("updates password when user matches migration shape", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({ id: "u1" } as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never);

    const res = await POST({
      request: new Request("http://localhost/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localLogin: "abc12", password: "password1" }),
      }),
    } as never);
    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.user.update)).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { passwordHash: "new-hash", mustResetPassword: false },
    });
  });
});
