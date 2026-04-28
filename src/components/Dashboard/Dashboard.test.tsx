import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Dashboard from "./Dashboard";

describe("Dashboard", () => {
  beforeEach(() => {
    localStorage.removeItem("defaultSeasonId");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows helper link when default season is not set", () => {
    render(<Dashboard />);

    expect(screen.getByRole("heading", { name: "Witaj, Organizatorze!" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Brak domyślnego sezonu/i })).toHaveAttribute("href", "/settings");
  });

  it("loads and displays default season chip from API", async () => {
    localStorage.setItem("defaultSeasonId", "s1");
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/seasons") {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "s1", name: "Sezon 1", year: 2026 }],
        });
      }
      if (url === "/api/tournaments") {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url === "/api/teams?seasonId=s1") {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url === "/api/referees?seasonId=s1") {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({ ok: false, json: async () => null });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Dashboard />);

    await waitFor(
      () => {
        const seasonChipLink = screen.getByRole("link", { name: "Sezon 1 (2026)" });
        expect(seasonChipLink).toHaveAttribute("href", "/settings");
      },
      { timeout: 10000 }
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/seasons", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
});
