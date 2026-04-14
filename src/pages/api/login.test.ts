import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/password", () => ({
  verifyPassword: vi.fn(),
}));

vi.mock("@/lib/auth/sessionCookies", () => ({
  setAuthSessionCookies: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

let POST: (ctx: unknown) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/pages/api/login");
  POST = mod.POST as unknown as (ctx: unknown) => Promise<Response>;
});

const cookies = () => {
  const store = new Map<string, string>();
  return {
    set: vi.fn((name: string, value: string) => {
      store.set(name, value);
    }),
    get: vi.fn((name: string) => (store.has(name) ? { value: store.get(name) } : undefined)),
  };
};

describe("POST /api/login", () => {
  it("returns 401 when user not found", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/login", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ localLogin: "nobody", password: "password1" }),
    });

    const res = await POST({
      request,
      cookies: cookies(),
      redirect: vi.fn(),
      url: new URL("http://localhost/"),
    } as never);
    expect(res.status).toBe(401);
  });

  it("returns JSON ok when password matches", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { verifyPassword } = await import("@/lib/auth/password");
    const { setAuthSessionCookies } = await import("@/lib/auth/sessionCookies");

    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      id: "u1",
      role: "ADMIN",
      passwordHash: "hash",
      mustResetPassword: false,
    } as never);
    vi.mocked(verifyPassword).mockResolvedValueOnce(true);

    const request = new Request("http://localhost/api/login", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ localLogin: "admin", password: "demo-password" }),
    });

    const res = await POST({
      request,
      cookies: cookies(),
      redirect: vi.fn(),
      url: new URL("http://localhost/"),
    } as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(setAuthSessionCookies).toHaveBeenCalled();
  });

  it("returns mustResetPassword when user must change password after login", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { verifyPassword } = await import("@/lib/auth/password");
    const { setAuthSessionCookies } = await import("@/lib/auth/sessionCookies");

    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      id: "u1",
      role: "ADMIN",
      passwordHash: "hash",
      mustResetPassword: true,
    } as never);
    vi.mocked(verifyPassword).mockResolvedValueOnce(true);

    const request = new Request("http://localhost/api/login", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ localLogin: "admin", password: "demo-password" }),
    });

    const res = await POST({
      request,
      cookies: cookies(),
      redirect: vi.fn(),
      url: new URL("http://localhost/"),
    } as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; mustResetPassword: boolean };
    expect(body.ok).toBe(true);
    expect(body.mustResetPassword).toBe(true);
    expect(setAuthSessionCookies).toHaveBeenCalled();
  });
});
