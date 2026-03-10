import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TournamentDetails from "./TournamentDetails";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TournamentDetails", () => {
  it("shows not found message for unknown tournament id", () => {
    render(<TournamentDetails id="missing-tournament-id" />);

    expect(screen.getByText("Nie znaleziono turnieju.")).toBeInTheDocument();
  });

  it("renders selected tournament details for valid tournament id", async () => {
    render(<TournamentDetails id="t1" />);

    expect(screen.getByRole("heading", { name: "Turniej Otwarcia Sezonu" })).toBeInTheDocument();
    expect(screen.getByText("Hala Arena")).toBeInTheDocument();
    expect(screen.getByText("Hotel Sport")).toBeInTheDocument();
    // Wait for teams fetch to finish; then empty list shows this message
    expect(await screen.findByText("Brak przypisanych drużyn.")).toBeInTheDocument();
  });
});
