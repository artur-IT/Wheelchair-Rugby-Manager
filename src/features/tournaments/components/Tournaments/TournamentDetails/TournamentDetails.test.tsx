import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TournamentDetails from "./TournamentDetails";

const tournamentFixture = {
  id: "t1",
  name: "Turniej Otwarcia Sezonu",
  startDate: "2024-05-10",
  endDate: "2024-05-12",
  seasonId: "s1",
  venue: {
    id: "v1",
    tournamentId: "t1",
    name: "Hala Arena",
    address: "ul. Olimpijska 1",
    mapUrl: "https://maps.google.com",
  },
  accommodation: {
    id: "a1",
    tournamentId: "t1",
    name: "Hotel Sport",
    address: "ul. Hotelowa 5",
    mapUrl: "https://maps.google.com",
  },
  catering: "Hotel + Catering na hali",
  teams: [],
  referees: [],
  classifiers: [],
  volunteers: [],
};

const refereeList = [
  { id: "ref-1", firstName: "Jan", lastName: "Kowalski", email: "jan@example.com", seasonId: "s1" },
  { id: "ref-2", firstName: "Anna", lastName: "Nowak", email: "anna@example.com", seasonId: "s1" },
];
const classifierList = [
  { id: "cls-1", firstName: "Piotr", lastName: "Wiśniewski", email: "p@example.com", seasonId: "s1" },
  { id: "cls-2", firstName: "Maria", lastName: "Lewandowska", email: "m@example.com", seasonId: "s1" },
];

beforeEach(() => {
  const tournamentWithTeams = {
    ...tournamentFixture,
    teams: [
      { id: "team-1", name: "Warsaw Raptors", seasonId: "s1" },
      { id: "team-2", name: "Krakow Eagles", seasonId: "s1" },
    ],
  };
  const tournamentAfterRemove = {
    ...tournamentFixture,
    teams: [{ id: "team-2", name: "Krakow Eagles", seasonId: "s1" }],
  };
  const tournamentWithReferees = { ...tournamentFixture, referees: refereeList };
  const tournamentAfterRefereeRemove = { ...tournamentFixture, referees: [refereeList[1]] };
  const tournamentWithClassifiers = { ...tournamentFixture, classifiers: classifierList };
  const tournamentAfterClassifierRemove = { ...tournamentFixture, classifiers: [classifierList[1]] };

  let teamsAdded = false;
  let teamRemoved = false;
  let refereesAdded = false;
  let refereeRemoved = false;
  let classifiersAdded = false;
  let classifierRemoved = false;

  interface MatchStub {
    id: string;
    scheduledAt: string;
    court: string | null;
    jerseyInfo: string | null;
    scoreA: number | null;
    scoreB: number | null;
    status: string;
    tournamentId: string;
    teamAId: string;
    teamBId: string;
  }

  let matches: MatchStub[] = [];

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/tournaments/missing-tournament-id") {
        return new Response(JSON.stringify({ error: "Nie znaleziono turnieju" }), { status: 404 });
      }

      if (url === "/api/tournaments/t1" && (!init || init.method == null)) {
        if (teamRemoved) {
          return new Response(JSON.stringify(tournamentAfterRemove), { status: 200 });
        }
        if (refereeRemoved && refereesAdded) {
          return new Response(JSON.stringify(tournamentAfterRefereeRemove), { status: 200 });
        }
        if (classifierRemoved && classifiersAdded) {
          return new Response(JSON.stringify(tournamentAfterClassifierRemove), { status: 200 });
        }
        if (refereesAdded) {
          return new Response(JSON.stringify(tournamentWithReferees), { status: 200 });
        }
        if (classifiersAdded) {
          return new Response(JSON.stringify(tournamentWithClassifiers), { status: 200 });
        }
        return new Response(JSON.stringify(teamsAdded ? tournamentWithTeams : tournamentFixture), { status: 200 });
      }

      if (url === "/api/teams?seasonId=s1") {
        return new Response(
          JSON.stringify([
            { id: "team-1", name: "Warsaw Raptors", seasonId: "s1" },
            { id: "team-2", name: "Krakow Eagles", seasonId: "s1" },
            { id: "team-3", name: "Gdansk Sharks", seasonId: "s1" },
          ]),
          { status: 200 }
        );
      }

      if (url === "/api/tournaments/t1/teams" && init?.method === "POST") {
        teamsAdded = true;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (url === "/api/tournaments/t1/teams/team-1" && init?.method === "DELETE") {
        teamRemoved = true;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (url === "/api/referees?seasonId=s1") {
        return new Response(JSON.stringify(refereeList), { status: 200 });
      }
      if (url === "/api/tournaments/t1/referees" && init?.method === "POST") {
        refereesAdded = true;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (url === "/api/tournaments/t1/referees/ref-1" && init?.method === "DELETE") {
        refereeRemoved = true;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (url === "/api/classifiers?seasonId=s1") {
        return new Response(JSON.stringify(classifierList), { status: 200 });
      }
      if (url === "/api/tournaments/t1/classifiers" && init?.method === "POST") {
        classifiersAdded = true;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (url === "/api/tournaments/t1/classifiers/cls-1" && init?.method === "DELETE") {
        classifierRemoved = true;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (url === "/api/tournaments/t1/matches" && (!init?.method || init.method === "GET")) {
        return new Response(JSON.stringify(matches), { status: 200 });
      }

      if (url === "/api/tournaments/t1/referee-plan" && (!init?.method || init.method === "GET")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }

      if (url === "/api/tournaments/t1/matches" && init?.method === "POST") {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        matches = [
          {
            id: "match-1",
            scheduledAt: body.scheduledAt ?? new Date("2024-05-10T10:00:00.000Z").toISOString(),
            court: body.court ?? null,
            jerseyInfo: body.jerseyInfo ?? null,
            scoreA: body.scoreA ?? null,
            scoreB: body.scoreB ?? null,
            status: "SCHEDULED",
            tournamentId: "t1",
            teamAId: body.teamAId ?? "team-1",
            teamBId: body.teamBId ?? "team-2",
          },
        ];
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (url === "/api/tournaments/t1/matches/match-1" && init?.method === "PUT") {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        matches = [
          {
            id: "match-1",
            scheduledAt: body.scheduledAt ?? new Date("2024-05-10T10:00:00.000Z").toISOString(),
            court: body.court ?? null,
            jerseyInfo: body.jerseyInfo ?? null,
            scoreA: body.scoreA ?? null,
            scoreB: body.scoreB ?? null,
            status: "SCHEDULED",
            tournamentId: "t1",
            teamAId: body.teamAId ?? "team-1",
            teamBId: body.teamBId ?? "team-2",
          },
        ];
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (url === "/api/tournaments/t1/matches/match-1" && init?.method === "DELETE") {
        matches = [];
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      return new Response(JSON.stringify({ error: "Not mocked" }), { status: 500 });
    }) as never
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TournamentDetails", () => {
  it("shows not found message for unknown tournament id", () => {
    render(<TournamentDetails id="missing-tournament-id" />);

    return screen.findByText("Nie znaleziono turnieju.").then(() => {
      expect(screen.getByText("Nie znaleziono turnieju.")).toBeInTheDocument();
    });
  });

  it("renders selected tournament details for valid tournament id", async () => {
    render(<TournamentDetails id="t1" />);

    expect(await screen.findByRole("heading", { name: "Turniej Otwarcia Sezonu" })).toBeInTheDocument();
    expect(await screen.findByText("Hala Arena")).toBeInTheDocument();
    expect(await screen.findByText("Hotel Sport")).toBeInTheDocument();
    expect(await screen.findByText("Hotel + Catering na hali")).toBeInTheDocument();
    expect(await screen.findByText("Brak przypisanych drużyn.")).toBeInTheDocument();
    const teamsSection = screen.getByRole("heading", { name: "Drużyny" }).closest("div");
    expect(within(teamsSection as HTMLElement).getByRole("button", { name: "Dodaj" })).toBeInTheDocument();
  });

  it("adds multiple teams via dialog and shows them", async () => {
    const user = userEvent.setup();
    render(<TournamentDetails id="t1" />);

    await screen.findByRole("heading", { name: "Turniej Otwarcia Sezonu" });
    const teamsSection = screen.getByRole("heading", { name: "Drużyny" }).closest("div");
    await user.click(within(teamsSection as HTMLElement).getByRole("button", { name: "Dodaj" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Dodaj drużyny")).toBeInTheDocument();

    await user.click(within(dialog).getByText("Warsaw Raptors"));
    await user.click(within(dialog).getByText("Krakow Eagles"));

    await user.click(within(dialog).getByRole("button", { name: "Dodaj" }));

    expect(await screen.findByText("Warsaw Raptors")).toBeInTheDocument();
    expect(screen.getByText("Krakow Eagles")).toBeInTheDocument();
  });

  it("preselects already added teams in add dialog", async () => {
    const user = userEvent.setup();
    render(<TournamentDetails id="t1" />);

    await screen.findByRole("heading", { name: "Turniej Otwarcia Sezonu" });
    const teamsSection = screen.getByRole("heading", { name: "Drużyny" }).closest("div") as HTMLElement;

    // First add two teams
    await user.click(within(teamsSection).getByRole("button", { name: "Dodaj" }));
    const addDialog1 = await screen.findByRole("dialog");
    await user.click(within(addDialog1).getByText("Warsaw Raptors"));
    await user.click(within(addDialog1).getByText("Krakow Eagles"));
    await user.click(within(addDialog1).getByRole("button", { name: "Dodaj" }));

    expect(await screen.findByText("Warsaw Raptors")).toBeInTheDocument();
    expect(screen.getByText("Krakow Eagles")).toBeInTheDocument();

    // Open dialog again and verify checkboxes are pre-selected
    await user.click(within(teamsSection).getByRole("button", { name: "Dodaj" }));
    const addDialog2 = await screen.findByRole("dialog");

    // Available teams are rendered in the order from the mocked /api/teams response.
    const checkboxes = within(addDialog2).getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);

    expect(checkboxes[0]).toBeChecked(); // Warsaw Raptors
    expect(checkboxes[1]).toBeChecked(); // Krakow Eagles
    expect(checkboxes[2]).not.toBeChecked(); // Gdansk Sharks
  });

  it("removes a team from tournament after confirmation", async () => {
    const user = userEvent.setup();
    render(<TournamentDetails id="t1" />);

    await screen.findByRole("heading", { name: "Turniej Otwarcia Sezonu" });
    const teamsSection = screen.getByRole("heading", { name: "Drużyny" }).closest("div");
    await user.click(within(teamsSection as HTMLElement).getByRole("button", { name: "Dodaj" }));

    const addDialog = await screen.findByRole("dialog");
    await user.click(within(addDialog).getByText("Warsaw Raptors"));
    await user.click(within(addDialog).getByText("Krakow Eagles"));
    await user.click(within(addDialog).getByRole("button", { name: "Dodaj" }));

    expect(await screen.findByText("Warsaw Raptors")).toBeInTheDocument();
    expect(screen.getByText("Krakow Eagles")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Usuń drużynę Warsaw Raptors z turnieju/i }));

    const confirmDialog = await screen.findByRole("dialog");
    expect(within(confirmDialog).getByText("Usunąć drużynę z turnieju?")).toBeInTheDocument();
    await user.click(within(confirmDialog).getByRole("button", { name: "Usuń" }));

    expect(await screen.findByText("Krakow Eagles")).toBeInTheDocument();
    expect(screen.queryByText("Warsaw Raptors")).not.toBeInTheDocument();
  });

  it("adds first match when plan is empty", async () => {
    const user = userEvent.setup();
    render(<TournamentDetails id="t1" />);

    await screen.findByRole("heading", { name: "Turniej Otwarcia Sezonu" });

    // Add teams so dialog has valid options.
    const teamsSection = screen.getByRole("heading", { name: "Drużyny" }).closest("div") as HTMLElement;
    await user.click(within(teamsSection).getByRole("button", { name: "Dodaj" }));

    const addTeamsDialog = await screen.findByRole("dialog");
    await user.click(within(addTeamsDialog).getByText("Warsaw Raptors"));
    await user.click(within(addTeamsDialog).getByText("Krakow Eagles"));
    await user.click(within(addTeamsDialog).getByRole("button", { name: "Dodaj" }));

    // Wait for teams list to update (and teams dialog to close).
    expect(await screen.findByText("Warsaw Raptors")).toBeInTheDocument();

    const planSection = screen.getByRole("heading", { name: "Plan Rozgrywek" }).closest("div") as HTMLElement;
    await user.click(within(planSection).getByRole("button", { name: "Dodaj" }));

    const addMatchDialog = await screen.findByRole("dialog");
    expect(within(addMatchDialog).getByText("Tworzenie planu rozgrywek")).toBeInTheDocument();

    expect(within(addMatchDialog).getByLabelText("Dzień tygodnia")).toBeInTheDocument();
    expect(within(addMatchDialog).getByLabelText("Drużyna A")).toBeInTheDocument();
    expect(within(addMatchDialog).getByLabelText("Drużyna B")).toBeInTheDocument();
    expect(within(addMatchDialog).getByLabelText("Start")).toBeInTheDocument();
    expect(within(addMatchDialog).getByLabelText("Koniec")).toBeInTheDocument();
    expect(within(addMatchDialog).getByLabelText("Boisko")).toBeInTheDocument();
    expect(within(addMatchDialog).getByLabelText("Wynik A")).toBeInTheDocument();
    expect(within(addMatchDialog).getByLabelText("Wynik B")).toBeInTheDocument();

    await user.click(within(addMatchDialog).getByRole("button", { name: "Dodaj" }));

    expect(await within(planSection).findByText("Warsaw Raptors")).toBeInTheDocument();
    expect(within(planSection).getByText("Krakow Eagles")).toBeInTheDocument();
    expect(within(planSection).getByText(/A:\s*Jasne\s*B:\s*Ciemne/)).toBeInTheDocument();
  }, 10000);

  it("edits match from plan", async () => {
    const user = userEvent.setup();
    render(<TournamentDetails id="t1" />);

    await screen.findByRole("heading", { name: "Turniej Otwarcia Sezonu" });

    // Add teams so dialog has valid options.
    const teamsSection = screen.getByRole("heading", { name: "Drużyny" }).closest("div") as HTMLElement;
    await user.click(within(teamsSection).getByRole("button", { name: "Dodaj" }));

    const addTeamsDialog = await screen.findByRole("dialog");
    await user.click(within(addTeamsDialog).getByText("Warsaw Raptors"));
    await user.click(within(addTeamsDialog).getByText("Krakow Eagles"));
    await user.click(within(addTeamsDialog).getByRole("button", { name: "Dodaj" }));
    expect(await screen.findByText("Warsaw Raptors")).toBeInTheDocument();

    // Add first match.
    const planSection = screen.getByRole("heading", { name: "Plan Rozgrywek" }).closest("div") as HTMLElement;
    await user.click(within(planSection).getByRole("button", { name: "Dodaj" }));

    const addMatchDialog = await screen.findByRole("dialog");
    await user.click(within(addMatchDialog).getByRole("button", { name: "Dodaj" }));

    expect(await within(planSection).findByText("Warsaw Raptors")).toBeInTheDocument();
    expect(within(planSection).getByText("Krakow Eagles")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Tworzenie planu rozgrywek")).not.toBeInTheDocument());

    await user.click(within(planSection).getByRole("button", { name: "Edytuj" }));

    const editDialog = await screen.findByRole("dialog");
    expect(within(editDialog).getByText("Edycja meczu")).toBeInTheDocument();

    const scoreAInput = within(editDialog).getByLabelText("Wynik A") as HTMLInputElement;
    await user.clear(scoreAInput);
    await user.type(scoreAInput, "2");

    await user.click(within(editDialog).getByRole("button", { name: "Zapisz" }));

    expect(await within(planSection).findByText("2")).toBeInTheDocument();
  }, 10000);

  it("deletes match from plan", async () => {
    const user = userEvent.setup();
    render(<TournamentDetails id="t1" />);

    await screen.findByRole("heading", { name: "Turniej Otwarcia Sezonu" });

    // Add teams so dialog has valid options.
    const teamsSection = screen.getByRole("heading", { name: "Drużyny" }).closest("div") as HTMLElement;
    await user.click(within(teamsSection).getByRole("button", { name: "Dodaj" }));

    const addTeamsDialog = await screen.findByRole("dialog");
    await user.click(within(addTeamsDialog).getByText("Warsaw Raptors"));
    await user.click(within(addTeamsDialog).getByText("Krakow Eagles"));
    await user.click(within(addTeamsDialog).getByRole("button", { name: "Dodaj" }));
    expect(await screen.findByText("Warsaw Raptors")).toBeInTheDocument();

    // Add first match.
    const planSection = screen.getByRole("heading", { name: "Plan Rozgrywek" }).closest("div") as HTMLElement;
    await user.click(within(planSection).getByRole("button", { name: "Dodaj" }));

    const addMatchDialog = await screen.findByRole("dialog");
    await user.click(within(addMatchDialog).getByRole("button", { name: "Dodaj" }));

    expect(await within(planSection).findByText("Warsaw Raptors")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Tworzenie planu rozgrywek")).not.toBeInTheDocument());

    await user.click(within(planSection).getByRole("button", { name: "Edytuj" }));

    const editDialog = await screen.findByRole("dialog");
    await user.click(within(editDialog).getByRole("button", { name: "Usuń" }));

    const confirmDialog = await screen.findByRole("dialog");
    expect(within(confirmDialog).getByText("Usunąć mecz?")).toBeInTheDocument();
    await user.click(within(confirmDialog).getByRole("button", { name: "Usuń" }));

    expect(await screen.findByText(/Brak zaplanowanych meczów\./)).toBeInTheDocument();
  }, 10000);

  it("deletes entire scheduled day from plan", async () => {
    const user = userEvent.setup();
    render(<TournamentDetails id="t1" />);

    await screen.findByRole("heading", { name: "Turniej Otwarcia Sezonu" });

    // Add teams so dialog has valid options.
    const teamsSection = screen.getByRole("heading", { name: "Drużyny" }).closest("div") as HTMLElement;
    await user.click(within(teamsSection).getByRole("button", { name: "Dodaj" }));

    const addTeamsDialog = await screen.findByRole("dialog");
    await user.click(within(addTeamsDialog).getByText("Warsaw Raptors"));
    await user.click(within(addTeamsDialog).getByText("Krakow Eagles"));
    await user.click(within(addTeamsDialog).getByRole("button", { name: "Dodaj" }));
    expect(await screen.findByText("Warsaw Raptors")).toBeInTheDocument();

    // Add first match.
    const planSection = screen.getByRole("heading", { name: "Plan Rozgrywek" }).closest("div") as HTMLElement;
    await user.click(within(planSection).getByRole("button", { name: "Dodaj" }));

    const addMatchDialog = await screen.findByRole("dialog");
    await user.click(within(addMatchDialog).getByRole("button", { name: "Dodaj" }));

    // Upewniamy się, że modal tworzenia meczu się zamknął.
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    expect(await within(planSection).findByText("Warsaw Raptors")).toBeInTheDocument();

    // Delete whole day.
    await user.click(screen.getByRole("button", { name: "Usuń" }));

    const confirmDialog = await screen.findByRole("dialog");
    await user.click(within(confirmDialog).getByRole("button", { name: "Usuń" }));

    expect(await screen.findByText(/Brak zaplanowanych meczów\./)).toBeInTheDocument();
  }, 10000);

  it("adds referees via dialog and shows them", async () => {
    const user = userEvent.setup();
    render(<TournamentDetails id="t1" />);

    await screen.findByRole("heading", { name: "Turniej Otwarcia Sezonu" });
    const refereesSection = screen.getByText("Sędziowie").closest("div");
    const addRefereesBtn = within(refereesSection as HTMLElement).getByRole("button", { name: "Dodaj" });
    await user.click(addRefereesBtn);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Dodaj sędziów")).toBeInTheDocument();
    await user.click(within(dialog).getByText("Jan Kowalski"));
    await user.click(within(dialog).getByText("Anna Nowak"));
    await user.click(within(dialog).getByRole("button", { name: "Dodaj" }));

    expect(await screen.findByText("Jan Kowalski")).toBeInTheDocument();
    expect(screen.getByText("Anna Nowak")).toBeInTheDocument();
  });

  it("removes a referee from tournament after confirmation", async () => {
    const user = userEvent.setup();
    render(<TournamentDetails id="t1" />);

    await screen.findByRole("heading", { name: "Turniej Otwarcia Sezonu" });
    const refereesSection = screen.getByText("Sędziowie").closest("div");
    await user.click(within(refereesSection as HTMLElement).getByRole("button", { name: "Dodaj" }));

    const addDialog = await screen.findByRole("dialog");
    await user.click(within(addDialog).getByText("Jan Kowalski"));
    await user.click(within(addDialog).getByText("Anna Nowak"));
    await user.click(within(addDialog).getByRole("button", { name: "Dodaj" }));

    expect(await screen.findByText("Jan Kowalski")).toBeInTheDocument();
    expect(screen.getByText("Anna Nowak")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Usuń sędziego Jan Kowalski z turnieju/i }));

    const confirmDialog = await screen.findByRole("dialog");
    expect(within(confirmDialog).getByText("Usunąć sędziego z turnieju?")).toBeInTheDocument();
    await user.click(within(confirmDialog).getByRole("button", { name: "Usuń" }));

    expect(await screen.findByText("Anna Nowak")).toBeInTheDocument();
    expect(screen.queryByText("Jan Kowalski")).not.toBeInTheDocument();
  }, 10000);

  it("adds classifiers via dialog and shows them", async () => {
    const user = userEvent.setup();
    render(<TournamentDetails id="t1" />);

    await screen.findByRole("heading", { name: "Turniej Otwarcia Sezonu" });
    const classifiersSection = screen.getByText("Klasyfikatorzy").closest("div");
    const addClassifiersBtn = within(classifiersSection as HTMLElement).getByRole("button", { name: "Dodaj" });
    await user.click(addClassifiersBtn);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Dodaj klasyfikatorów")).toBeInTheDocument();
    await user.click(within(dialog).getByText("Piotr Wiśniewski"));
    await user.click(within(dialog).getByText("Maria Lewandowska"));
    await user.click(within(dialog).getByRole("button", { name: "Dodaj" }));

    expect(await screen.findByText("Piotr Wiśniewski")).toBeInTheDocument();
    expect(screen.getByText("Maria Lewandowska")).toBeInTheDocument();
  });

  it("removes a classifier from tournament after confirmation", async () => {
    const user = userEvent.setup();
    render(<TournamentDetails id="t1" />);

    await screen.findByRole("heading", { name: "Turniej Otwarcia Sezonu" });
    const classifiersSection = screen.getByText("Klasyfikatorzy").closest("div");
    await user.click(within(classifiersSection as HTMLElement).getByRole("button", { name: "Dodaj" }));

    const addDialog = await screen.findByRole("dialog");
    await user.click(within(addDialog).getByText("Piotr Wiśniewski"));
    await user.click(within(addDialog).getByText("Maria Lewandowska"));
    await user.click(within(addDialog).getByRole("button", { name: "Dodaj" }));

    expect(await screen.findByText("Piotr Wiśniewski")).toBeInTheDocument();
    expect(screen.getByText("Maria Lewandowska")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Usuń klasyfikatora Piotr Wiśniewski z turnieju/i }));

    const confirmDialog = await screen.findByRole("dialog");
    expect(within(confirmDialog).getByText("Usunąć klasyfikatora z turnieju?")).toBeInTheDocument();
    await user.click(within(confirmDialog).getByRole("button", { name: "Usuń" }));

    expect(await screen.findByText("Maria Lewandowska")).toBeInTheDocument();
    expect(screen.queryByText("Piotr Wiśniewski")).not.toBeInTheDocument();
  });
});
