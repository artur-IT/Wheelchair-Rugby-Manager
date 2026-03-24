import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TeamNewPlayer, { type PlayerRow } from "@/features/teams/components/Team/TeamNewPlayer/TeamNewPlayer";

const basePlayer: PlayerRow = {
  id: "player-1",
  firstName: "Jan",
  lastName: "Kowalski",
  classification: 2.5,
  number: 11,
};

describe("TeamNewPlayer", () => {
  it("renders dialog inputs and actions", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const setNewPlayerForm = vi.fn();

    render(
      <TeamNewPlayer
        open
        onClose={onClose}
        onSave={onSave}
        playerActionError={null}
        playerActionLoading={false}
        newPlayerForm={basePlayer}
        setNewPlayerForm={setNewPlayerForm}
      />
    );

    expect(screen.getByRole("heading", { name: "Dodaj zawodnika" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /imię/i })).toHaveValue("Jan");
    expect(screen.getByRole("textbox", { name: /nazwisko/i })).toHaveValue("Kowalski");
    expect(screen.getByRole("spinbutton", { name: /klasyfikacja/i })).toHaveValue(2.5);
    expect(screen.getByRole("spinbutton", { name: /numer/i })).toHaveValue(11);

    await userEvent.type(screen.getByRole("textbox", { name: /imię/i }), "ek");
    expect(setNewPlayerForm).toHaveBeenCalled();
  });

  it("shows error message when provided", () => {
    render(
      <TeamNewPlayer
        open
        onClose={vi.fn()}
        onSave={vi.fn()}
        playerActionError="Błąd"
        playerActionLoading={false}
        newPlayerForm={basePlayer}
        setNewPlayerForm={vi.fn()}
      />
    );
    expect(screen.getByText("Błąd")).toBeInTheDocument();
  });

  it("disables save button while loading and shows spinner", () => {
    render(
      <TeamNewPlayer
        open
        onClose={vi.fn()}
        onSave={vi.fn()}
        playerActionError={null}
        playerActionLoading
        newPlayerForm={basePlayer}
        setNewPlayerForm={vi.fn()}
      />
    );

    const [cancelButton, saveButton] = screen.getAllByRole("button");
    expect(cancelButton).toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("blocks save and shows errors when form data is invalid", async () => {
    const onSave = vi.fn();
    const invalidPlayer: PlayerRow = { id: "x", firstName: "", lastName: "", classification: 0, number: 0 };

    render(
      <TeamNewPlayer
        open
        onClose={vi.fn()}
        onSave={onSave}
        playerActionError={null}
        playerActionLoading={false}
        newPlayerForm={invalidPlayer}
        setNewPlayerForm={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Dodaj zawodnika" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Imię jest wymagane")).toBeInTheDocument();
    expect(screen.getByText("Nazwisko jest wymagane")).toBeInTheDocument();
    expect(screen.getByText("Klasyfikacja: 0.5–3.5")).toBeInTheDocument();
    expect(screen.getByText("Numer: 1–99")).toBeInTheDocument();
  });
});
