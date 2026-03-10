import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TournamentDetails from "./TournamentDetails";

describe("TournamentDetails", () => {
  it("shows not found message for unknown tournament id", () => {
    render(<TournamentDetails id="missing-tournament-id" />);

    expect(screen.getByText("Nie znaleziono turnieju.")).toBeInTheDocument();
  });

  it("renders selected tournament details for valid tournament id", () => {
    render(<TournamentDetails id="t1" />);

    expect(screen.getByRole("heading", { name: "Turniej Otwarcia Sezonu" })).toBeInTheDocument();
    expect(screen.getByText("Hala Arena")).toBeInTheDocument();
    expect(screen.getByText("Hotel Sport")).toBeInTheDocument();
    expect(screen.getByText("Warsaw Dragons")).toBeInTheDocument();
  });
});
