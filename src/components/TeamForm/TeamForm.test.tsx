import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TeamForm from "./TeamForm";

describe("TeamForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows helper text when no seasons are returned", async () => {
    render(<TeamForm />);

    expect(await screen.findByText(/Brak sezonów/i)).toBeInTheDocument();
  });

  it("shows validation error after submit without team name", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: "s1", name: "Sezon 1" }] }));

    render(<TeamForm />);
    await screen.findByRole("button", { name: "Zapisz Drużynę" });
    await user.click(screen.getByRole("button", { name: "Zapisz Drużynę" }));

    expect(await screen.findByText("Nazwa drużyny jest wymagana")).toBeInTheDocument();
  });

  it("sends team payload with selected season id after valid submit", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "s1", name: "Sezon 1" }] })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { formErrors: ["Błąd testowy"] } }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<TeamForm />);
    await screen.findByRole("button", { name: "Zapisz Drużynę" });

    await user.type(screen.getByLabelText("Nazwa Drużyny"), "Test Team");
    await user.type(screen.getByLabelText("Adres"), "Test Address");
    await user.type(screen.getByLabelText("Imię"), "Jan");
    await user.type(screen.getByLabelText("Nazwisko"), "Kowalski");
    await user.type(screen.getByLabelText("Email"), "jan@example.com");
    await user.type(screen.getByLabelText("Telefon"), "123456789");
    await user.click(screen.getByRole("button", { name: "Zapisz Drużynę" }));

    const [, submitOptions] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/teams",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(JSON.parse(String(submitOptions.body))).toEqual({
      name: "Test Team",
      address: "Test Address",
      contactFirstName: "Jan",
      contactLastName: "Kowalski",
      contactEmail: "jan@example.com",
      contactPhone: "123456789",
      seasonId: "s1",
    });
  });
});
