import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/clubAuth", () => ({
  getRequesterIdentity: vi.fn(),
}));

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
  beforeEach(async () => {
    const { getRequesterIdentity } = await import("@/lib/clubAuth");
    vi.mocked(getRequesterIdentity).mockReset();
  });

  it("GET returns 401 without session user id", async () => {
    const { getRequesterIdentity } = await import("@/lib/clubAuth");
    vi.mocked(getRequesterIdentity).mockResolvedValueOnce({
      ok: false,
      response: new Response(null, { status: 401 }),
    });

    const response = await GET({
      cookies: { get: vi.fn().mockReturnValue(undefined) },
    } as never);

    expect(response.status).toBe(401);
  });

  it("GET returns 200 for logged in user", async () => {
    const { getRequesterIdentity } = await import("@/lib/clubAuth");
    vi.mocked(getRequesterIdentity).mockResolvedValueOnce({
      ok: true,
      identity: { userId: "owner-1", role: "ADMIN" },
    });

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
    const { getRequesterIdentity } = await import("@/lib/clubAuth");
    vi.mocked(getRequesterIdentity).mockResolvedValueOnce({
      ok: true,
      identity: { userId: "owner-1", role: "ADMIN" },
    });

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

