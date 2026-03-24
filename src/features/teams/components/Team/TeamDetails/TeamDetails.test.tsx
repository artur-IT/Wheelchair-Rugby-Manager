import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TeamDetails from "./TeamDetails";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TeamDetails", () => {
  it("shows not found message for unknown team id", async () => {
    render(<TeamDetails id="missing-team-id" />);

    expect(await screen.findByText("Nie znaleziono drużyny.")).toBeInTheDocument();
  });
});
