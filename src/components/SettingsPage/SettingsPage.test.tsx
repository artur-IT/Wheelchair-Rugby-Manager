import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "./SettingsPage";

// Stub fetch so SeasonsManager doesn't crash (no real server in tests)
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SettingsPage", () => {
  it("renders the settings heading", async () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: "Ustawienia Sezonu" })).toBeInTheDocument();
    // Settle async fetch in SeasonsManager to avoid act() warnings
    await screen.findByText(/Brak sezonu/i);
  });

  it("shows season hint on default tab when no season is selected", async () => {
    render(<SettingsPage />);
    expect(screen.getByText("Wybierz sezon, aby zobaczyć drużyny.")).toBeInTheDocument();
    await screen.findByText(/Brak sezonu/i);
  });

  it("renders all three navigation tabs", async () => {
    render(<SettingsPage />);
    expect(screen.getByRole("tab", { name: /Drużyny/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Sędziowie/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Klasyfikatorzy/i })).toBeInTheDocument();
    await screen.findByText(/Brak sezonu/i);
  });

  it("shows no-seasons alert when API returns empty list", async () => {
    render(<SettingsPage />);
    // findByText waits for the async fetch to resolve and state to update
    expect(await screen.findByText(/Brak sezonu/i)).toBeInTheDocument();
  });
});
