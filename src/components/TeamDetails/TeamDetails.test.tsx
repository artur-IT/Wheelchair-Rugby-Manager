import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TeamDetails from "./TeamDetails";

describe("TeamDetails", () => {
  it("shows not found message for unknown team id", () => {
    render(<TeamDetails id="missing-team-id" />);

    expect(screen.getByText("Nie znaleziono drużyny.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Warsaw Dragons" })).not.toBeInTheDocument();
  });
});
