import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createTournament,
  deleteTournamentById,
  deleteTournamentMatch,
  fetchTournamentById,
  fetchTournamentByIdOrNull,
  fetchTournamentMatches,
  fetchTournamentRefereePlan,
  fetchTournamentsList,
  setTournamentTeams,
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

  it("fetchTournamentByIdOrNull returns null on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "Nie znaleziono" }), { status: 404 }))
    );
    await expect(fetchTournamentByIdOrNull("missing")).resolves.toBeNull();
  });

  it("fetchTournamentMatches returns list on OK", async () => {
    const body = [{ id: "m1", tournamentId: "t1", teamAId: "a", teamBId: "b", scheduledAt: "", status: "SCHEDULED" }];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }))
    );
    await expect(fetchTournamentMatches("t1")).resolves.toEqual(body);
  });

  it("fetchTournamentRefereePlan returns list on OK", async () => {
    const body = [{ matchId: "m1", scheduledAt: "", teamAId: "a", teamBId: "b", refereeAssignments: {} }];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }))
    );
    await expect(fetchTournamentRefereePlan("t1")).resolves.toEqual(body);
  });

  it("deleteTournamentMatch sends DELETE", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, init) => {
        expect(String(url)).toContain("/api/tournaments/t1/matches/m1");
        expect(init?.method).toBe("DELETE");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      })
    );
    await expect(deleteTournamentMatch("t1", "m1")).resolves.toBeUndefined();
  });

  it("setTournamentTeams sends POST with teamIds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, init) => {
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual({ teamIds: ["a", "b"] });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      })
    );
    await expect(setTournamentTeams("t1", ["a", "b"])).resolves.toBeUndefined();
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
