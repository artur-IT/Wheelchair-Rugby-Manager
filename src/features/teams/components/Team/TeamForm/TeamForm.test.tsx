import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import QueryProvider from "@/components/QueryProvider/QueryProvider";
import type { Team } from "@/types";

import { TeamFormContent } from "./TeamForm";

function renderWithQuery(ui: ReactNode) {
  return render(<QueryProvider>{ui}</QueryProvider>);
}

describe("TeamForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows helper text when no seasons are returned", async () => {
    renderWithQuery(<TeamFormContent />);

    expect(await screen.findByText(/Brak sezonów/i)).toBeInTheDocument();
  });

  it("shows validation error after submit without team name", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: "s1", name: "Sezon 1" }] }));

    renderWithQuery(<TeamFormContent />);
    await screen.findByRole("button", { name: "Zapisz Drużynę" });
    await user.click(screen.getByRole("button", { name: "Zapisz Drużynę" }));

    expect(await screen.findByText("Nazwa drużyny jest wymagana")).toBeInTheDocument();
  });

  it("sends team payload with selected season id after valid submit", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "s1", name: "Sezon 1" }] }) // GET /api/seasons
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "coach1", firstName: "Anna", lastName: "Nowak" }) }) // POST /api/coaches
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "t1", name: "Test Team" }) }); // POST /api/teams
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(<TeamFormContent onSuccess={onSuccess} />);
    await screen.findByRole("button", { name: "Zapisz Drużynę" });

    await user.type(screen.getByLabelText("Nazwa Drużyny"), "Test Team");
    await user.type(screen.getByLabelText("Ulica"), "Test Address");
    await user.type(screen.getByLabelText("Miasto"), "Warszawa");
    await user.type(screen.getByLabelText("Kod pocztowy"), "00-001");
    await user.type(screen.getAllByLabelText(/^Imię/)[0], "Jan");
    await user.type(screen.getAllByLabelText(/^Nazwisko/)[0], "Kowalski");
    await user.type(screen.getAllByLabelText(/^E-mail/)[0], "jan@example.com");
    await user.type(screen.getAllByLabelText(/^Telefon/)[0], "123456789");
    // Fill required coach fields (index 1: contact is [0], coach is [1], referee is [2])
    await user.type(screen.getAllByLabelText(/^Imię/)[1], "Anna");
    await user.type(screen.getAllByLabelText(/^Nazwisko/)[1], "Nowak");
    await user.click(screen.getByRole("button", { name: "Zapisz Drużynę" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    const coachCall = fetchMock.mock.calls.find((c) => c[0] === "/api/coaches") as [string, RequestInit] | undefined;
    expect(coachCall).toBeDefined();
    if (!coachCall) throw new Error("Coach call missing");
    const [, coachOptions] = coachCall;
    expect(JSON.parse(String(coachOptions.body))).toEqual({
      firstName: "Anna",
      lastName: "Nowak",
      seasonId: "s1",
    });

    const teamPostCall = fetchMock.mock.calls.find(
      (c) => c[0] === "/api/teams" && (c[1] as RequestInit)?.method === "POST"
    ) as [string, RequestInit] | undefined;
    expect(teamPostCall).toBeDefined();
    if (!teamPostCall) throw new Error("Team submit call missing");
    const [, submitOptions] = teamPostCall;
    expect(JSON.parse(String(submitOptions.body))).toEqual({
      name: "Test Team",
      address: "Test Address",
      city: "Warszawa",
      postalCode: "00-001",
      contactFirstName: "Jan",
      contactLastName: "Kowalski",
      contactEmail: "jan@example.com",
      contactPhone: "123456789",
      seasonId: "s1",
      coachId: "coach1",
      players: [],
    });
  }, 30000);

  it("blocks submit and shows classification error for invalid player value", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => [{ id: "s1", name: "Sezon 1" }] });
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(<TeamFormContent />);
    await screen.findByRole("button", { name: "Zapisz Drużynę" });

    await user.type(screen.getByLabelText("Nazwa Drużyny"), "Test Team");
    await user.type(screen.getByLabelText("Ulica"), "Test Address");
    await user.type(screen.getByLabelText("Miasto"), "Warszawa");
    await user.type(screen.getByLabelText("Kod pocztowy"), "00-001");
    await user.type(screen.getAllByLabelText(/^Imię/)[0], "Jan");
    await user.type(screen.getAllByLabelText(/^Nazwisko/)[0], "Kowalski");
    await user.type(screen.getAllByLabelText(/^E-mail/)[0], "jan@example.com");
    await user.type(screen.getAllByLabelText(/^Telefon/)[0], "123456789");
    await user.type(screen.getAllByLabelText(/^Imię/)[1], "Anna");
    await user.type(screen.getAllByLabelText(/^Nazwisko/)[1], "Nowak");

    await user.click(screen.getByRole("button", { name: "Dodaj zawodnika" }));
    await user.type(screen.getAllByLabelText("Klasyfikacja")[0], "0.7");
    await user.click(screen.getByRole("button", { name: "Zapisz Drużynę" }));

    expect(await screen.findByText("Klasyfikacja: 0.5–3.5")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some((call) => call[0] === "/api/teams")).toBe(false);
  });

  it("blocks submit and shows player number error for invalid player value", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => [{ id: "s1", name: "Sezon 1" }] });
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(<TeamFormContent />);
    await screen.findByRole("button", { name: "Zapisz Drużynę" });

    await user.type(screen.getByLabelText("Nazwa Drużyny"), "Test Team");
    await user.type(screen.getByLabelText("Ulica"), "Test Address");
    await user.type(screen.getByLabelText("Miasto"), "Warszawa");
    await user.type(screen.getByLabelText("Kod pocztowy"), "00-001");
    await user.type(screen.getAllByLabelText(/^Imię/)[0], "Jan");
    await user.type(screen.getAllByLabelText(/^Nazwisko/)[0], "Kowalski");
    await user.type(screen.getAllByLabelText(/^E-mail/)[0], "jan@example.com");
    await user.type(screen.getAllByLabelText(/^Telefon/)[0], "123456789");
    await user.type(screen.getAllByLabelText(/^Imię/)[1], "Anna");
    await user.type(screen.getAllByLabelText(/^Nazwisko/)[1], "Nowak");

    await user.click(screen.getByRole("button", { name: "Dodaj zawodnika" }));
    await user.type(screen.getAllByLabelText("Numer")[0], "0");
    await user.click(screen.getByRole("button", { name: "Zapisz Drużynę" }));

    expect(await screen.findByText("Numer: 1–99")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some((call) => call[0] === "/api/teams")).toBe(false);
  });

  it("does not create a new referee when editing and only referee email changes", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "s1", name: "Sezon 1" }] }) // GET /api/seasons
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "r1", firstName: "Piotr", lastName: "Sedzia", phone: "555666777" }],
      }) // GET /api/referees?seasonId=s1
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "r1", firstName: "Piotr", lastName: "Sedzia" }) }) // PATCH /api/referees/r1
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "t1", name: "Team Updated" }) }); // PUT /api/teams/t1
    vi.stubGlobal("fetch", fetchMock);

    const initialTeam = {
      id: "t1",
      name: "Team A",
      address: "Address 1",
      city: "Warszawa",
      postalCode: "00-001",
      websiteUrl: "",
      contactFirstName: "Jan",
      contactLastName: "Kowalski",
      contactEmail: "jan@example.com",
      contactPhone: "123456789",
      seasonId: "s1",
      coachId: "c1",
      coach: { id: "c1", firstName: "Anna", lastName: "Nowak", email: "", phone: null },
      refereeId: "r1",
      referee: { id: "r1", firstName: "Piotr", lastName: "Sedzia", email: "", phone: "555666777" },
      players: [],
      staff: [],
    } as unknown as Team;

    renderWithQuery(<TeamFormContent mode="edit" initialTeam={initialTeam} onSuccess={onSuccess} />);
    await screen.findByRole("button", { name: "Zapisz zmiany" });

    await user.type(screen.getByLabelText("E-mail (opcjonalnie)"), "ref@example.com");
    await user.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    const refereePatchCall = fetchMock.mock.calls.find(
      (call) => call[0] === "/api/referees/r1" && (call[1] as RequestInit)?.method === "PATCH"
    ) as [string, RequestInit] | undefined;
    expect(refereePatchCall).toBeDefined();
    if (!refereePatchCall) throw new Error("Referee patch call missing");
    const [, refereePatchOptions] = refereePatchCall;
    expect(JSON.parse(String(refereePatchOptions.body))).toEqual({
      firstName: "Piotr",
      lastName: "Sedzia",
      email: "ref@example.com",
      phone: "555666777",
    });
    const teamPutCall = fetchMock.mock.calls.find(
      (call) => call[0] === "/api/teams/t1" && (call[1] as RequestInit)?.method === "PUT"
    ) as [string, RequestInit] | undefined;
    expect(teamPutCall).toBeDefined();
    if (!teamPutCall) throw new Error("Team update call missing");
    const [, submitOptions] = teamPutCall;
    expect(JSON.parse(String(submitOptions.body)).refereeId).toBe("r1");
  });

  it("does not create a new coach when editing and only coach email changes", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "s1", name: "Sezon 1" }] }) // GET /api/seasons
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "c1", firstName: "Anna", lastName: "Nowak", phone: "111222333" }],
      }) // GET /api/coaches?seasonId=s1
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "c1", firstName: "Anna", lastName: "Nowak" }) }) // PATCH /api/coaches/c1
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "t1", name: "Team Updated" }) }); // PUT /api/teams/t1
    vi.stubGlobal("fetch", fetchMock);

    const initialTeam = {
      id: "t1",
      name: "Team A",
      address: "Address 1",
      city: "Warszawa",
      postalCode: "00-001",
      websiteUrl: "",
      contactFirstName: "Jan",
      contactLastName: "Kowalski",
      contactEmail: "jan@example.com",
      contactPhone: "123456789",
      seasonId: "s1",
      coachId: "c1",
      coach: { id: "c1", firstName: "Anna", lastName: "Nowak", email: "", phone: "111222333" },
      refereeId: "r1",
      referee: { id: "r1", firstName: "Piotr", lastName: "Sedzia", email: "", phone: null },
      players: [],
      staff: [],
    } as unknown as Team;

    renderWithQuery(<TeamFormContent mode="edit" initialTeam={initialTeam} onSuccess={onSuccess} />);
    await screen.findByRole("button", { name: "Zapisz zmiany" });

    await user.type(screen.getAllByLabelText(/^E-mail$/)[1], "coach@example.com");
    await user.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    const coachPatchCall = fetchMock.mock.calls.find(
      (call) => call[0] === "/api/coaches/c1" && (call[1] as RequestInit)?.method === "PATCH"
    ) as [string, RequestInit] | undefined;
    expect(coachPatchCall).toBeDefined();
    if (!coachPatchCall) throw new Error("Coach patch call missing");
    const [, coachPatchOptions] = coachPatchCall;
    expect(JSON.parse(String(coachPatchOptions.body))).toEqual({
      firstName: "Anna",
      lastName: "Nowak",
      email: "coach@example.com",
      phone: "111222333",
    });

    const teamPutCall = fetchMock.mock.calls.find(
      (call) => call[0] === "/api/teams/t1" && (call[1] as RequestInit)?.method === "PUT"
    ) as [string, RequestInit] | undefined;
    expect(teamPutCall).toBeDefined();
    if (!teamPutCall) throw new Error("Team update call missing");
    const [, submitOptions] = teamPutCall;
    expect(JSON.parse(String(submitOptions.body)).coachId).toBe("c1");
  });

  it("updates existing coach by coach.id when coachId is missing in initial team", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "s1", name: "Sezon 1" }] }) // GET /api/seasons
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "c1", firstName: "Anna", lastName: "Nowak", phone: "111222333" }],
      }) // GET /api/coaches?seasonId=s1
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "c1", firstName: "Anna", lastName: "Nowak" }) }) // PATCH /api/coaches/c1
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "t1", name: "Team Updated" }) }); // PUT /api/teams/t1
    vi.stubGlobal("fetch", fetchMock);

    const initialTeam = {
      id: "t1",
      name: "Team A",
      address: "Address 1",
      city: "Warszawa",
      postalCode: "00-001",
      websiteUrl: "",
      contactFirstName: "Jan",
      contactLastName: "Kowalski",
      contactEmail: "jan@example.com",
      contactPhone: "123456789",
      seasonId: "s1",
      coachId: null,
      coach: { id: "c1", firstName: "Anna", lastName: "Nowak", email: "", phone: "111222333" },
      refereeId: "r1",
      referee: { id: "r1", firstName: "Piotr", lastName: "Sedzia", email: "", phone: null },
      players: [],
      staff: [],
    } as unknown as Team;

    renderWithQuery(<TeamFormContent mode="edit" initialTeam={initialTeam} onSuccess={onSuccess} />);
    await screen.findByRole("button", { name: "Zapisz zmiany" });

    await user.type(screen.getAllByLabelText(/^E-mail$/)[1], "coach@example.com");
    await user.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    const coachPatchCall = fetchMock.mock.calls.find(
      (call) => call[0] === "/api/coaches/c1" && (call[1] as RequestInit)?.method === "PATCH"
    ) as [string, RequestInit] | undefined;
    expect(coachPatchCall).toBeDefined();
    expect(
      fetchMock.mock.calls.some((call) => call[0] === "/api/coaches" && (call[1] as RequestInit)?.method === "POST")
    ).toBe(false);

    const teamPutCall = fetchMock.mock.calls.find(
      (call) => call[0] === "/api/teams/t1" && (call[1] as RequestInit)?.method === "PUT"
    ) as [string, RequestInit] | undefined;
    expect(teamPutCall).toBeDefined();
    if (!teamPutCall) throw new Error("Team update call missing");
    const [, submitOptions] = teamPutCall;
    expect(JSON.parse(String(submitOptions.body)).coachId).toBe("c1");
  });

  it("creates new coach when coach is missing in season list", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "s1", name: "Sezon 1" }] }) // GET /api/seasons
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // GET /api/coaches?seasonId=s1
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "c2", firstName: "Anna", lastName: "Nowak" }) }) // POST /api/coaches
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "t1", name: "Team Updated" }) }); // PUT /api/teams/t1
    vi.stubGlobal("fetch", fetchMock);

    const initialTeam = {
      id: "t1",
      name: "Team A",
      address: "Address 1",
      city: "Warszawa",
      postalCode: "00-001",
      websiteUrl: "",
      contactFirstName: "Jan",
      contactLastName: "Kowalski",
      contactEmail: "jan@example.com",
      contactPhone: "123456789",
      seasonId: "s1",
      coachId: "stale-id",
      coach: { id: "stale-id", firstName: "Anna", lastName: "Nowak", email: "", phone: "111222333" },
      refereeId: "r1",
      referee: { id: "r1", firstName: "Piotr", lastName: "Sedzia", email: "", phone: null },
      players: [],
      staff: [],
    } as unknown as Team;

    renderWithQuery(<TeamFormContent mode="edit" initialTeam={initialTeam} onSuccess={onSuccess} />);
    await screen.findByRole("button", { name: "Zapisz zmiany" });

    await user.type(screen.getAllByLabelText(/^E-mail$/)[1], "coach@example.com");
    await user.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    const coachPostCall = fetchMock.mock.calls.find(
      (call) => call[0] === "/api/coaches" && (call[1] as RequestInit)?.method === "POST"
    ) as [string, RequestInit] | undefined;
    expect(coachPostCall).toBeDefined();
    if (!coachPostCall) throw new Error("Coach create call missing");
    const [, coachCreateOptions] = coachPostCall;
    expect(JSON.parse(String(coachCreateOptions.body))).toEqual({
      firstName: "Anna",
      lastName: "Nowak",
      email: "coach@example.com",
      phone: "111222333",
      seasonId: "s1",
    });

    const teamPutCall = fetchMock.mock.calls.find(
      (call) => call[0] === "/api/teams/t1" && (call[1] as RequestInit)?.method === "PUT"
    ) as [string, RequestInit] | undefined;
    expect(teamPutCall).toBeDefined();
    if (!teamPutCall) throw new Error("Team update call missing");
    const [, submitOptions] = teamPutCall;
    expect(JSON.parse(String(submitOptions.body)).coachId).toBe("c2");
  });

  it("reuses existing coach by phone when initial coach id is stale", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "s1", name: "Sezon 1" }] }) // GET /api/seasons
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "c9", firstName: "Anna", lastName: "Nowak", email: "", phone: "111222333" }],
      }) // GET /api/coaches?seasonId=s1
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "c9", firstName: "Anna", lastName: "Nowak" }) }) // PATCH /api/coaches/c9
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "t1", name: "Team Updated" }) }); // PUT /api/teams/t1
    vi.stubGlobal("fetch", fetchMock);

    const initialTeam = {
      id: "t1",
      name: "Team A",
      address: "Address 1",
      city: "Warszawa",
      postalCode: "00-001",
      websiteUrl: "",
      contactFirstName: "Jan",
      contactLastName: "Kowalski",
      contactEmail: "jan@example.com",
      contactPhone: "123456789",
      seasonId: "s1",
      coachId: "stale-id",
      coach: { id: "stale-id", firstName: "Anna", lastName: "Nowak", email: "", phone: "111222333" },
      refereeId: "r1",
      referee: { id: "r1", firstName: "Piotr", lastName: "Sedzia", email: "", phone: null },
      players: [],
      staff: [],
    } as unknown as Team;

    renderWithQuery(<TeamFormContent mode="edit" initialTeam={initialTeam} onSuccess={onSuccess} />);
    await screen.findByRole("button", { name: "Zapisz zmiany" });

    await user.type(screen.getAllByLabelText(/^E-mail$/)[1], "coach@example.com");
    await user.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    expect(
      fetchMock.mock.calls.some(
        (call) =>
          call[0] === "/api/coaches?seasonId=s1" && ((call[1] as RequestInit | undefined)?.method ?? "GET") === "GET"
      )
    ).toBe(true);
    expect(
      fetchMock.mock.calls.some((call) => call[0] === "/api/coaches/c9" && (call[1] as RequestInit)?.method === "PATCH")
    ).toBe(true);
    expect(
      fetchMock.mock.calls.some((call) => call[0] === "/api/coaches" && (call[1] as RequestInit)?.method === "POST")
    ).toBe(false);

    const teamPutCall = fetchMock.mock.calls.find(
      (call) => call[0] === "/api/teams/t1" && (call[1] as RequestInit)?.method === "PUT"
    ) as [string, RequestInit] | undefined;
    expect(teamPutCall).toBeDefined();
    if (!teamPutCall) throw new Error("Team update call missing");
    const [, submitOptions] = teamPutCall;
    expect(JSON.parse(String(submitOptions.body)).coachId).toBe("c9");
  });

  it("blurs active submit button before calling edit onSuccess", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "s1", name: "Sezon 1" }] }) // GET /api/seasons
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "r1", firstName: "Piotr", lastName: "Sedzia", phone: "555666777" }],
      }) // GET /api/referees?seasonId=s1
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "r1", firstName: "Piotr", lastName: "Sedzia" }) }) // PATCH /api/referees/r1
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "t1", name: "Team Updated" }) }); // PUT /api/teams/t1
    vi.stubGlobal("fetch", fetchMock);

    const initialTeam = {
      id: "t1",
      name: "Team A",
      address: "Address 1",
      city: "Warszawa",
      postalCode: "00-001",
      websiteUrl: "",
      contactFirstName: "Jan",
      contactLastName: "Kowalski",
      contactEmail: "jan@example.com",
      contactPhone: "123456789",
      seasonId: "s1",
      coachId: "c1",
      coach: { id: "c1", firstName: "Anna", lastName: "Nowak", email: "", phone: null },
      refereeId: "r1",
      referee: { id: "r1", firstName: "Piotr", lastName: "Sedzia", email: "", phone: "555666777" },
      players: [],
      staff: [],
    } as unknown as Team;

    renderWithQuery(<TeamFormContent mode="edit" initialTeam={initialTeam} onSuccess={onSuccess} />);
    const submitButton = await screen.findByRole("button", { name: "Zapisz zmiany" });

    await user.type(screen.getByLabelText("E-mail (opcjonalnie)"), "ref@example.com");
    submitButton.focus();
    expect(document.activeElement).toBe(submitButton);
    await user.click(submitButton);

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(document.activeElement).not.toBe(submitButton);
  });
});

