import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "@/lib/zodPl";
import {
  ensureClubExists,
  ensureEntityAccess,
  parseRequestJson,
  parseWithSchema,
  requiredId,
  requiredText,
} from "@/lib/clubApiHelpers";
import { getClubById } from "@/lib/club";
import { authorizeClubAccess } from "@/lib/clubAuth";

vi.mock("@/lib/club", () => ({
  getClubById: vi.fn(),
}));

vi.mock("@/lib/clubAuth", () => ({
  authorizeClubAccess: vi.fn(),
}));

describe("clubApiHelpers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requiredId returns 400 when id is missing", () => {
    const result = requiredId(undefined, "Brak id");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });

  it("requiredText trims value", () => {
    const result = requiredText("  owner-1  ", "Brak ownerUserId");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe("owner-1");
  });

  it("parseRequestJson returns 400 for invalid JSON", async () => {
    const request = new Request("http://localhost/api", {
      method: "POST",
      body: "{",
      headers: { "Content-Type": "application/json" },
    });
    const result = await parseRequestJson(request);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });

  it("parseWithSchema returns parsed payload", () => {
    const schema = z.object({ name: z.string().min(1) });
    const result = parseWithSchema(schema, { name: "Club A" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ name: "Club A" });
  });

  it("ensureClubExists returns 404 when club does not exist", async () => {
    vi.mocked(getClubById).mockResolvedValue(null);
    const result = await ensureClubExists("club-x");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(404);
  });

  it("ensureEntityAccess returns 403 when auth fails", async () => {
    vi.mocked(authorizeClubAccess).mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Brak uprawnień" }), { status: 403 }),
    });

    const result = await ensureEntityAccess(
      new Request("http://localhost/test"),
      { id: "x", clubId: "club-1" },
      (item) => item.clubId,
      "Nie znaleziono"
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });
});

