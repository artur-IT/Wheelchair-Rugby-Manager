import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

let GET: (ctx: unknown) => Promise<Response>;

function cookies(session: string | undefined, userId: string | undefined) {
  return {
    get: vi.fn((name: string) => {
      if (name === "session") return session ? { value: session } : undefined;
      if (name === "sessionUserId") return userId ? { value: userId } : undefined;
      return undefined;
    }),
  } as never;
}

beforeAll(async () => {
  const mod = await import("@/pages/api/auth/password-reset-status");
  GET = mod.GET as unknown as (ctx: unknown) => Promise<Response>;
});

describe("GET /api/auth/password-reset-status", () => {
  it("returns loggedIn false without session", async () => {
    const res = await GET({ cookies: cookies(undefined, undefined) } as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { loggedIn: boolean; mustResetPassword: boolean };
    expect(body.loggedIn).toBe(false);
    expect(body.mustResetPassword).toBe(false);
  });

  it("returns flags for authenticated user", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ mustResetPassword: true } as never);

    const res = await GET({ cookies: cookies("ok", "u1") } as never);
    const body = (await res.json()) as { loggedIn: boolean; mustResetPassword: boolean };
    expect(body.loggedIn).toBe(true);
    expect(body.mustResetPassword).toBe(true);
  });
});
