import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCurrentUserProfile, updateCurrentUserProfile } from "@/lib/api/users";

describe("users api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns user profile from api", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ firstName: "Jan", lastName: "Kowalski", email: "jan@example.com" }),
      })
    );

    await expect(fetchCurrentUserProfile()).resolves.toEqual({
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan@example.com",
    });
  });

  it("allows empty names when email exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ firstName: "", lastName: "", email: "jan@example.com" }),
      })
    );

    await expect(fetchCurrentUserProfile()).resolves.toEqual({
      firstName: "",
      lastName: "",
      email: "jan@example.com",
    });
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

    await expect(fetchCurrentUserProfile()).rejects.toThrow("Brak autoryzacji");
  });

  it("updates user profile via api", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ firstName: "Anna", lastName: "Nowak", email: "anna@example.com" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateCurrentUserProfile({ firstName: "Anna", lastName: "Nowak" })).resolves.toEqual({
      firstName: "Anna",
      lastName: "Nowak",
      email: "anna@example.com",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "Anna", lastName: "Nowak" }),
    });
  });
});
