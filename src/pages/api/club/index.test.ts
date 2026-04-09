import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    club: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

let GET: (ctx: unknown) => Promise<Response>;
let POST: (ctx: unknown) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/pages/api/club/index");
  GET = mod.GET as unknown as (ctx: unknown) => Promise<Response>;
  POST = mod.POST as unknown as (ctx: unknown) => Promise<Response>;
});

describe("club API /api/club", () => {
  it("GET returns 401 without session user id", async () => {
    const response = await GET({
      cookies: { get: vi.fn().mockReturnValue(undefined) },
    } as never);

    expect(response.status).toBe(401);
  });

  it("GET returns 200 for logged in user", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.club.findMany).mockResolvedValueOnce([]);

    const response = await GET({
      cookies: {
        get: vi.fn((name: string) => (name === "sessionUserId" ? { value: "owner-1" } : undefined)),
      },
    } as never);

    expect(response.status).toBe(200);
  });

  it("POST returns 400 for invalid JSON body", async () => {
    const request = new Request("http://localhost/api/club", {
      method: "POST",
      body: "{",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST({
      request,
      cookies: {
        get: vi.fn((name: string) => (name === "sessionUserId" ? { value: "owner-1" } : undefined)),
      },
    } as never);
    expect(response.status).toBe(400);
  });
});

