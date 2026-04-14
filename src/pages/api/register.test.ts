import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("argon2-hash"),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      create: vi.fn(),
    },
  },
}));

let POST: (ctx: unknown) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/pages/api/register");
  POST = mod.POST as unknown as (ctx: unknown) => Promise<Response>;
});

describe("POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid JSON", async () => {
    const request = new Request("http://localhost/api/register", {
      method: "POST",
      body: "{",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST({ request } as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when validation fails", async () => {
    const request = new Request("http://localhost/api/register", {
      method: "POST",
      body: JSON.stringify({ localLogin: "!!!", password: "short", email: "bad" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST({ request } as never);
    expect(res.status).toBe(400);
  });

  it("returns 201 when user is created", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { hashPassword } = await import("@/lib/auth/password");
    vi.mocked(prisma.user.create).mockResolvedValueOnce({} as never);

    const request = new Request("http://localhost/api/register", {
      method: "POST",
      body: JSON.stringify({
        localLogin: "abc12",
        password: "password1",
        email: "abc@example.com",
        name: "Abc",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST({ request } as never);
    expect(res.status).toBe(201);
    expect(vi.mocked(hashPassword)).toHaveBeenCalledWith("password1");
    expect(vi.mocked(prisma.user.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          localLogin: "abc12",
          email: "abc@example.com",
          authProvider: "LOCAL",
          role: "ADMIN",
          passwordHash: "argon2-hash",
          mustResetPassword: false,
        }),
      })
    );
  });

  it("returns 409 on unique constraint", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.create).mockRejectedValueOnce({ code: "P2002" });

    const request = new Request("http://localhost/api/register", {
      method: "POST",
      body: JSON.stringify({
        localLogin: "taken",
        password: "password1",
        email: "taken@example.com",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST({ request } as never);
    expect(res.status).toBe(409);
  });
});
