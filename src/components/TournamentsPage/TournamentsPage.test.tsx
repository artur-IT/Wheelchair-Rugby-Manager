import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import TournamentsPage from "./TournamentsPage";

describe("TournamentsPage", () => {
  it("renders delete button and deletes a tournament after confirmation", async () => {
    const user = userEvent.setup();

    const tournamentA = {
      id: "t1",
      name: "Turniej A",
      startDate: "2026-01-10T00:00:00.000Z",
      endDate: null,
      seasonId: "s1",
      teams: [],
      referees: [],
      classifiers: [],
    };
    const tournamentB = {
      id: "t2",
      name: "Turniej B",
      startDate: "2026-02-10T00:00:00.000Z",
      endDate: null,
      seasonId: "s1",
      teams: [],
      referees: [],
      classifiers: [],
    };

    let listCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/tournaments" && (!init || init.method == null)) {
        listCalls += 1;
        if (listCalls === 1) {
          return new Response(JSON.stringify([tournamentA, tournamentB]), { status: 200 });
        }
        return new Response(JSON.stringify([tournamentB]), { status: 200 });
      }
      if (url === "/api/tournaments/t1" && init?.method === "DELETE") {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: "Not mocked" }), { status: 500 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<TournamentsPage />);

    expect(await screen.findByText("Turniej A")).toBeInTheDocument();
    expect(screen.getByText("Turniej B")).toBeInTheDocument();

    const cardTitle = screen.getByText("Turniej A");
    const card = cardTitle.closest(".MuiCard-root");
    expect(card).not.toBeNull();

    const deleteButton = within(card as HTMLElement).getByRole("button", { name: /Usuń turniej Turniej A/i });
    await user.click(deleteButton);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Usunąć turniej?")).toBeInTheDocument();

    const confirm = within(dialog).getByRole("button", { name: "Usuń" });
    await user.click(confirm);

    await waitFor(() => {
      expect(screen.queryByText("Turniej A")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Turniej B")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/tournaments/t1", { method: "DELETE" });
    });

    vi.unstubAllGlobals();
  });
});
