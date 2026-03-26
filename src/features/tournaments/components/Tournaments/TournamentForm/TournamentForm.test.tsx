import { TextField } from "@mui/material";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TournamentForm from "./TournamentForm";

vi.mock("@/components/ThemeRegistry/ThemeRegistry", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/AppShell/AppShell", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@mui/x-date-pickers/DatePicker", () => {
  const formatDate = (d: Date) => d.toISOString().slice(0, 10);

  return {
    DatePicker: ({
      label,
      value,
      onChange,
      slotProps,
    }: {
      label: string;
      value: Date | null | undefined;
      onChange: (val: Date | null) => void;
      slotProps?: { textField?: Record<string, unknown> };
    }) => (
      <TextField
        label={label}
        type="date"
        value={value ? formatDate(value) : ""}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
        {...slotProps?.textField}
      />
    ),
  };
});

describe("TournamentForm", () => {
  const tournamentFixture = {
    id: "t1",
    name: "Turniej Otwarcia Sezonu",
    startDate: "2024-05-10T00:00:00.000Z",
    endDate: "2024-05-12T00:00:00.000Z",
    seasonId: "s1",
    venue: {
      id: "v1",
      tournamentId: "t1",
      name: "Hala Arena",
      address: "ul. Olimpijska 1, 00-123 Warszawa",
      mapUrl: "https://maps.google.com",
    },
    accommodation: {
      id: "a1",
      tournamentId: "t1",
      name: "Hotel Sport",
      address: "ul. Hotelowa 5, 11-222 Krakow",
      mapUrl: "https://maps.google.com",
    },
    catering: "Pelne wyzywienie",
    breakfastServingTime: "07:00 - 09:00",
    breakfastLocation: "HOTEL",
    lunchServingTime: "12:00 - 14:00",
    lunchLocation: "HALL",
    dinnerServingTime: "18:00 - 20:00",
    dinnerLocation: "HOTEL",
    cateringNotes: "Bez laktozy",
    teams: [],
    referees: [],
    classifiers: [],
    volunteers: [],
  };

  const originalLocation = window.location;

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = typeof input === "string" ? input : input.url;

        if (url === "/api/tournaments/t1") {
          return { ok: true, json: async () => tournamentFixture };
        }

        return { ok: true, json: async () => ({ ok: true }) };
      })
    );

    Object.defineProperty(window, "location", {
      value: { href: "", assign: vi.fn() },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    try {
      Object.defineProperty(window, "location", { value: originalLocation });
    } catch {
      // JSDOM location restoration can fail depending on environment.
    }
  });

  it("loads tournament details in edit mode and sends PUT on submit", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/tournaments/t1" && (!init?.method || init.method === "GET")) {
        return { ok: true, json: async () => tournamentFixture };
      }

      if (url === "/api/tournaments/t1" && init?.method === "PUT") {
        return { ok: true, json: async () => ({ ok: true }) };
      }

      return { ok: true, json: async () => ({ ok: true }) };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<TournamentForm tournamentId="t1" />);

    const nameInput = await screen.findByLabelText("Nazwa Turnieju");
    await waitFor(() => expect((nameInput as HTMLInputElement).value).toBe(tournamentFixture.name));

    await waitFor(() => expect(screen.getByRole("button", { name: "Zapisz Turniej" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Zapisz Turniej" }));

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
      expect(putCall).toBeDefined();
    });

    const putCall = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT") as [string, RequestInit];
    expect(putCall[0]).toBe("/api/tournaments/t1");

    const [, putInit] = putCall;
    expect(putInit.method).toBe("PUT");

    const body = JSON.parse(String(putInit.body));
    expect(body.name).toBe(tournamentFixture.name);
    expect(typeof body.startDate).toBe("string");
    expect(typeof body.endDate).toBe("string");
  });
});
