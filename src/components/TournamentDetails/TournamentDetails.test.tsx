import { render, screen, within } from "@testing-library/react";
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
  });

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

    await user.click(
      screen.getByRole("button", { name: /Usuń klasyfikatora Piotr Wiśniewski z turnieju/i })
    );

    const confirmDialog = await screen.findByRole("dialog");
    expect(within(confirmDialog).getByText("Usunąć klasyfikatora z turnieju?")).toBeInTheDocument();
    await user.click(within(confirmDialog).getByRole("button", { name: "Usuń" }));

    expect(await screen.findByText("Maria Lewandowska")).toBeInTheDocument();
    expect(screen.queryByText("Piotr Wiśniewski")).not.toBeInTheDocument();
  });
});
