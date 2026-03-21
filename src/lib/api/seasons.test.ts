import { afterEach, describe, expect, it, vi } from "vitest";

import { createSeason, fetchSeasonById, fetchSeasonsList, updateSeason } from "./seasons";

describe("seasons API helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchSeasonsList returns array on OK", async () => {
    const body = [{ id: "s1", name: "A" }];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }))
    );
    await expect(fetchSeasonsList()).resolves.toEqual(body);
  });

  it("createSeason sends POST", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ id: "s1", name: "A" }), { status: 200 }))
    );
    await expect(createSeason({ name: "A", year: 2026 })).resolves.toMatchObject({ id: "s1" });
  });

  it("updateSeason sends PATCH", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, init) => {
        expect(url).toBe("/api/seasons/s1");
        expect((init as RequestInit).method).toBe("PATCH");
        return new Response(JSON.stringify({ id: "s1", name: "B" }), { status: 200 });
      })
    );
    await expect(updateSeason("s1", { name: "B", year: 2026 })).resolves.toMatchObject({ name: "B" });
  });

  it("fetchSeasonById returns season on OK", async () => {
    const body = { id: "s1", name: "Sezon 1", year: 2026 };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }))
    );
    await expect(fetchSeasonById("s1")).resolves.toEqual(body);
  });
});
