import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createTournament,
  deleteTournamentById,
  fetchTournamentById,
  fetchTournamentsList,
  updateTournament,
} from "./tournaments";
import type { TournamentFormData } from "@/lib/validateInputs";

describe("tournaments API helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchTournamentsList returns JSON on OK", async () => {
    const body = [{ id: "t1", name: "A", seasonId: "s1" }];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }))
    );

    await expect(fetchTournamentsList()).resolves.toEqual(body);
  });

  it("fetchTournamentsList throws with parsed message on error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "Serwer zajęty" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
      )
    );

    await expect(fetchTournamentsList()).rejects.toThrow("Serwer zajęty");
  });

  it("deleteTournamentById resolves on OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    );

    await expect(deleteTournamentById("t1")).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith("/api/tournaments/t1", { method: "DELETE" });
  });

  it("deleteTournamentById throws on error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "Brak uprawnień" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          })
      )
    );

    await expect(deleteTournamentById("t1")).rejects.toThrow("Brak uprawnień");
  });

  it("fetchTournamentById returns tournament on OK", async () => {
    const body = { id: "t1", name: "X", seasonId: "s1" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }))
    );
    await expect(fetchTournamentById("t1")).resolves.toEqual(body);
  });

  it("createTournament sends POST and returns JSON", async () => {
    const payload = { name: "A" } as TournamentFormData;
    const created = { id: "t2", name: "A", seasonId: "s1" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, init) => {
        expect(init?.method).toBe("POST");
        return new Response(JSON.stringify(created), { status: 200 });
      })
    );
    await expect(createTournament(payload)).resolves.toEqual(created);
  });

  it("updateTournament sends PUT", async () => {
    const payload = { name: "B" } as TournamentFormData;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, init) => {
        expect(url).toBe("/api/tournaments/t1");
        expect(init?.method).toBe("PUT");
        return new Response(JSON.stringify({ id: "t1", seasonId: "s1" }), { status: 200 });
      })
    );
    await expect(updateTournament("t1", payload)).resolves.toEqual({ id: "t1", seasonId: "s1" });
  });
});
