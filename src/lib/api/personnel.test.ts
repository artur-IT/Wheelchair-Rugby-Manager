import { afterEach, describe, expect, it, vi } from "vitest";

import { createPersonnel, deletePersonnel, fetchPersonnelBySeason, updatePersonnel } from "./personnel";

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

describe("personnel mutations", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates person via API helper", async () => {
    const created = { id: "r1", firstName: "A", lastName: "B" };
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      void _input;
      void _init;
      return new Response(JSON.stringify(created), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createPersonnel("/api/referees", { firstName: "A", lastName: "B", seasonId: "s1", email: null, phone: null })
    ).resolves.toEqual(created);

    const options = fetchMock.mock.calls[0]?.[1];
    expect(options).toBeDefined();
    expect((options as RequestInit).method).toBe("POST");
  });

  it("updates person via API helper", async () => {
    const updated = { id: "r1", firstName: "Anna", lastName: "Nowak" };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(updated), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updatePersonnel("/api/referees", "r1", { firstName: "Anna", lastName: "Nowak" })).resolves.toEqual(
      updated
    );
  });

  it("deletes person via API helper", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 }))
    );
    await expect(deletePersonnel("/api/referees", "r1")).resolves.toBeUndefined();
  });
});
