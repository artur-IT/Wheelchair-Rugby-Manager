import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchPersonnelBySeason } from "./personnel";

describe("fetchPersonnelBySeason", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns people on OK", async () => {
    const body = [{ id: "p1", firstName: "A", lastName: "B" }];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        expect(String(url)).toContain("/api/referees?seasonId=s1");
        return new Response(JSON.stringify(body), { status: 200 });
      })
    );
    await expect(fetchPersonnelBySeason("/api/referees", "s1", "load err")).resolves.toEqual(body);
  });
});
