import { afterEach, describe, expect, it, vi } from "vitest";

import { deleteTeamById, fetchTeamById, fetchTeamsBySeason } from "./teams";

describe("teams API helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchTeamById returns null on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({}), { status: 404 }))
    );
    await expect(fetchTeamById("x")).resolves.toBeNull();
  });

  it("fetchTeamsBySeason returns teams on OK", async () => {
    const body = [{ id: "t1", name: "A", seasonId: "s1" }];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        expect(String(url)).toContain("seasonId=s1");
        return new Response(JSON.stringify(body), { status: 200 });
      })
    );
    await expect(fetchTeamsBySeason("s1")).resolves.toEqual(body);
  });

  it("fetchTeamById returns team on OK", async () => {
    const body = { id: "t1", name: "A", seasonId: "s1" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }))
    );
    await expect(fetchTeamById("t1")).resolves.toEqual(body);
  });

  it("deleteTeamById resolves on OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    );
    await expect(deleteTeamById("t1")).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith("/api/teams/t1", { method: "DELETE" });
  });
});
