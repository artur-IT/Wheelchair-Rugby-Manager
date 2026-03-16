import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TeamFormContent } from "./TeamForm";

describe("TeamForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows helper text when no seasons are returned", async () => {
    render(<TeamFormContent />);

    expect(await screen.findByText(/Brak sezonów/i)).toBeInTheDocument();
  });

  it("shows validation error after submit without team name", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: "s1", name: "Sezon 1" }] }));

    render(<TeamFormContent />);
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

    render(<TeamFormContent onSuccess={onSuccess} />);
    await screen.findByRole("button", { name: "Zapisz Drużynę" });

    await user.type(screen.getByLabelText("Nazwa Drużyny"), "Test Team");
    await user.type(screen.getByLabelText("Adres"), "Test Address");
    await user.type(screen.getByLabelText("Miasto"), "Warszawa");
    await user.type(screen.getByLabelText("Kod pocztowy"), "00-001");
    await user.type(screen.getAllByLabelText(/^Imię/)[0], "Jan");
    await user.type(screen.getAllByLabelText(/^Nazwisko/)[0], "Kowalski");
    await user.type(screen.getAllByLabelText(/^Email/)[0], "jan@example.com");
    await user.type(screen.getAllByLabelText(/^Telefon/)[0], "123456789");
    // Fill required coach fields (index 1: contact is [0], coach is [1], referee is [2])
    await user.type(screen.getAllByLabelText(/^Imię/)[1], "Anna");
    await user.type(screen.getAllByLabelText(/^Nazwisko/)[1], "Nowak");
    await user.click(screen.getByRole("button", { name: "Zapisz Drużynę" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/teams",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    const [, coachOptions] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(String(coachOptions.body))).toEqual({
      firstName: "Anna",
      lastName: "Nowak",
      seasonId: "s1",
    });

    const [, submitOptions] = fetchMock.mock.calls[2] as [string, RequestInit];
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
  });
});
