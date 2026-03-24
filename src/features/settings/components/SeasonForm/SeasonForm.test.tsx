import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import SeasonForm from "./SeasonForm";

describe("SeasonForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders new season heading", () => {
    render(<SeasonForm />);

    expect(screen.getByRole("heading", { name: "Nowy Sezon" })).toBeInTheDocument();
  });

  it("shows validation errors after submit without required fields", async () => {
    const user = userEvent.setup();
    render(<SeasonForm />);

    await user.click(screen.getByRole("button", { name: "Zapisz Sezon" }));

    expect(await screen.findByText("Nazwa sezonu jest wymagana")).toBeInTheDocument();
    expect(screen.getByText("Rok sezonu jest wymagany")).toBeInTheDocument();
  });

  it("sends season payload after valid submit", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { formErrors: ["Błąd testowy"] } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<SeasonForm />);

    await user.type(screen.getByLabelText("Nazwa Sezonu"), "Sezon Testowy");
    await user.type(screen.getByLabelText("Rok"), "2026");
    await user.type(screen.getByLabelText("Opis"), "Opis testowy");
    await user.click(screen.getByRole("button", { name: "Zapisz Sezon" }));

    const [, submitOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/seasons",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(JSON.parse(String(submitOptions.body))).toEqual({
      name: "Sezon Testowy",
      year: 2026,
      description: "Opis testowy",
    });
  });
});
