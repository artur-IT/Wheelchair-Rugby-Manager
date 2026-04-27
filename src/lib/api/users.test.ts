import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCurrentUserName } from "@/lib/api/users";

describe("fetchCurrentUserName", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns user name from api", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: "Jan Kowalski" }),
      })
    );

    await expect(fetchCurrentUserName()).resolves.toBe("Jan Kowalski");
  });

  it("throws when api returns non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Brak autoryzacji" }),
      })
    );

    await expect(fetchCurrentUserName()).rejects.toThrow("Brak autoryzacji");
  });
});
