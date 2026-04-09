import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import QueryProvider from "@/components/QueryProvider/QueryProvider";

import ClubPage from "./ClubPage";

function renderWithQuery(ui: ReactNode) {
  return render(<QueryProvider>{ui}</QueryProvider>);
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

    renderWithQuery(<ClubPage />);

    expect(await screen.findByRole("button", { name: "Dodaj klub" })).toBeInTheDocument();
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

    renderWithQuery(<ClubPage />);
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
        if (url === "/api/club/c1/coaches" || url === "/api/club/c1/players" || url === "/api/club/c1/teams") {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      })
    );

    renderWithQuery(<ClubPage />);
    expect(await screen.findByRole("button", { name: "Edytuj" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Otwórz mapę" })).toHaveAttribute(
      "href",
      "https://maps.example.com/hala"
    );
  });

  it("shows create team button when club has no teams", async () => {
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
        if (url === "/api/club/c1/coaches" || url === "/api/club/c1/players" || url === "/api/club/c1/teams") {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      })
    );

    renderWithQuery(<ClubPage />);

    expect(await screen.findByText("Tygrysy")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Utwórz drużynę" })).toBeInTheDocument();
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
        if (url === "/api/club/c1/coaches" || url === "/api/club/c1/players") {
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
                players: [{ player: { id: "p1", firstName: "Adam", lastName: "Kowalski" } }],
              },
            ]),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      })
    );

    renderWithQuery(<ClubPage />);

    expect(await screen.findByText("Tygrysy A")).toBeInTheDocument();
    expect(await screen.findByText("Formuła: WR'4")).toBeInTheDocument();
    expect(await screen.findByText("Liczba zawodników: 1")).toBeInTheDocument();
    expect(await screen.findByText("Trener: Jan Nowak")).toBeInTheDocument();
  });
});
