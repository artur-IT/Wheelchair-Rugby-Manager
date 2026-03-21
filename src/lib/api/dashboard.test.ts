import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchDashboardSeasonData } from "./dashboard";

describe("fetchDashboardSeasonData", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws when all three requests fail", async () => {
    const bad = new Response(JSON.stringify({ error: "fail" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => bad)
    );

    await expect(fetchDashboardSeasonData("s1")).rejects.toThrow();
  });

  it("returns stats when all requests succeed with empty arrays", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL) => {
        const u = typeof url === "string" ? url : url.toString();
        if (u === "/api/tournaments") {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (u.includes("/api/teams")) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (u.includes("/api/referees")) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        return new Response(null, { status: 500 });
      })
    );

    const result = await fetchDashboardSeasonData("s1");
    expect(result.stats.tournaments).toBe(0);
    expect(result.partialWarning).toBeNull();
    expect(result.upcoming).toEqual([]);
  });
});
