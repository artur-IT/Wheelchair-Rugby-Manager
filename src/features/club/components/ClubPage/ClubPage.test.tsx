import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ClubPage from "./ClubPage";

function renderClubPage(ui: ReactNode = <ClubPage />) {
  return render(ui);
}

describe("ClubPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows add club button when user has no club", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/club") return new Response(JSON.stringify([]), { status: 200 });
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      })
    );

    renderClubPage(<ClubPage />);

    expect(await screen.findByRole("button", { name: "Dodaj klub" })).toBeInTheDocument();
  });

  it("disables add club button when club list fetch fails (e.g. no DB)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/club") {
          return new Response(JSON.stringify({ error: "DB unavailable" }), { status: 500 });
        }
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      })
    );

    renderClubPage(<ClubPage />);

    const addClubButton = await screen.findByRole("button", { name: "Dodaj klub" });
    expect(addClubButton).toBeDisabled();
  });

  it("shows friendly DB connection error when club fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/club") {
          throw new Error("Failed to fetch");
        }
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      })
    );

    renderClubPage(<ClubPage />);

    expect(await screen.findByText("Brak połączenia z bazą danych. Spróbuj ponownie.")).toBeInTheDocument();
    const addClubButton = await screen.findByRole("button", { name: "Dodaj klub" });
    expect(addClubButton).toBeDisabled();
  });

  it("opens full club form after clicking add button", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/club") return new Response(JSON.stringify([]), { status: 200 });
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      })
    );

    renderClubPage(<ClubPage />);
    await user.click(await screen.findByRole("button", { name: "Dodaj klub" }));

    expect(screen.getByLabelText("Nazwa klubu")).toBeInTheDocument();
    expect(screen.getByLabelText("Logo klubu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anuluj" })).toBeInTheDocument();
  });

  it("shows edit button when club exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/club") {
          return new Response(
            JSON.stringify([
              {
                id: "c1",
                ownerUserId: "u1",
                name: "Tygrysy",
                logoUrl: "https://example.com/logo.png",
                hallName: "Hala Miejska",
                hallAddress: "Sportowa 1",
                hallCity: "Gdańsk",
                hallPostalCode: "80-001",
                hallMapUrl: "https://maps.example.com/hala",
                createdAt: "2026-04-09",
              },
            ]),
            { status: 200 }
          );
        }
        if (
          url === "/api/club/c1/coaches" ||
          url === "/api/club/c1/players" ||
          url === "/api/club/c1/teams" ||
          url === "/api/club/c1/volunteers" ||
          url === "/api/club/c1/referees" ||
          url === "/api/club/c1/staff"
        ) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      })
    );

    renderClubPage(<ClubPage />);
    expect(await screen.findByRole("button", { name: "Edytuj" })).toBeInTheDocument();
  });

  it("shows add team button when club has no teams", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/club") {
          return new Response(
            JSON.stringify([{ id: "c1", ownerUserId: "u1", name: "Tygrysy", createdAt: "2026-04-09" }]),
            {
              status: 200,
            }
          );
        }
        if (
          url === "/api/club/c1/coaches" ||
          url === "/api/club/c1/players" ||
          url === "/api/club/c1/teams" ||
          url === "/api/club/c1/volunteers" ||
          url === "/api/club/c1/referees" ||
          url === "/api/club/c1/staff"
        ) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      })
    );

    renderClubPage(<ClubPage />);

    expect(await screen.findByText("Tygrysy")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Dodaj drużynę" })).toBeInTheDocument();
  });

  it("renders team tile with required data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/club") {
          return new Response(
            JSON.stringify([{ id: "c1", ownerUserId: "u1", name: "Tygrysy", createdAt: "2026-04-09" }]),
            {
              status: 200,
            }
          );
        }
        if (
          url === "/api/club/c1/coaches" ||
          url === "/api/club/c1/players" ||
          url === "/api/club/c1/volunteers" ||
          url === "/api/club/c1/referees" ||
          url === "/api/club/c1/staff"
        ) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (url === "/api/club/c1/teams") {
          return new Response(
            JSON.stringify([
              {
                id: "t1",
                name: "Tygrysy A",
                formula: "WR4",
                coach: { id: "co1", firstName: "Jan", lastName: "Nowak" },
                players: [{ player: { id: "p1", firstName: "Adam", lastName: "Kowalski", classification: 2.5 } }],
              },
            ]),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      })
    );

    const user = userEvent.setup();
    renderClubPage(<ClubPage />);

    expect(await screen.findByText("Tygrysy A")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Dodaj drużynę" })).toBeInTheDocument();
    expect(await screen.findByText("WR'4")).toBeInTheDocument();
    expect(await screen.findByText(/Zawodników:/)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(await screen.findByText(/Trener:/)).toBeInTheDocument();
    expect(screen.getByText("Jan Nowak")).toBeInTheDocument();

    await user.click(screen.getByText("Tygrysy A"));
    expect(await screen.findByText("Imię")).toBeInTheDocument();
    expect(screen.getByText("Adam")).toBeInTheDocument();
    expect(screen.getByText("Kowalski")).toBeInTheDocument();
    expect(screen.getByText("2.5")).toBeInTheDocument();
  });
});
