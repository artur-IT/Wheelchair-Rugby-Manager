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
  it("GET returns 400 when ownerUserId query is missing", async () => {
    const response = await GET({
      url: new URL("http://localhost/api/club"),
    } as never);

    expect(response.status).toBe(400);
  });

  it("POST returns 400 for invalid JSON body", async () => {
    const request = new Request("http://localhost/api/club", {
      method: "POST",
      body: "{",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST({ request } as never);
    expect(response.status).toBe(400);
  });
});

