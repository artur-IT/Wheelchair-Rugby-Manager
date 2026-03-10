import { render, screen } from "@testing-library/react";
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
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "s1", name: "Sezon 1", year: 2026 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Dashboard />);

    expect(await screen.findByRole("link", { name: "Sezon 1 (2026)" })).toHaveAttribute("href", "/settings");
    expect(fetchMock).toHaveBeenCalledWith("/api/seasons/s1");
  });
});
