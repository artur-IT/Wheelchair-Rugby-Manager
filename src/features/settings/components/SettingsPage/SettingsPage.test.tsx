import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "./SettingsPage";
import AddPersonDialog from "./AddPersonDialog";
import { MAX_SHORT_TEXT } from "@/lib/validateInputs";

// Stub fetch so SeasonsManager doesn't crash (no real server in tests)
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SettingsPage", () => {
  it("shows no-seasons alert when API returns empty list", async () => {
    render(<SettingsPage />);
    // findByText waits for the async fetch to resolve and state to update
    expect(await screen.findByText(/Brak sezonu/i)).toBeInTheDocument();
  });
});

// Helper that renders the dialog already open with a no-op onSubmit spy
function renderDialog(onSubmit = vi.fn()) {
  render(
    <AddPersonDialog
      open
      loading={false}
      error={null}
      dialogTitle="Dodaj osobę"
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />
  );
  return { onSubmit };
}

describe("AddPersonDialog — validation", () => {
  it("shows error and blocks submit when first name exceeds 50 characters", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    await user.type(screen.getByLabelText("Imię"), "A".repeat(MAX_SHORT_TEXT + 1));
    await user.type(screen.getByLabelText("Nazwisko"), "Kowalski");
    await user.click(screen.getByRole("button", { name: "Zapisz" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/nie mogą przekraczać 50 znaków/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows error and blocks submit when email exceeds 50 characters", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    await user.type(screen.getByLabelText("Imię"), "Jan");
    await user.type(screen.getByLabelText("Nazwisko"), "Kowalski");
    await user.type(screen.getByLabelText("Email"), `${"a".repeat(MAX_SHORT_TEXT)}@x.pl`);
    await user.click(screen.getByRole("button", { name: "Zapisz" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Email nie może przekraczać 50 znaków/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with correct payload when all fields are valid", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    await user.type(screen.getByLabelText("Imię"), "Jan");
    await user.type(screen.getByLabelText("Nazwisko"), "Kowalski");
    await user.click(screen.getByRole("button", { name: "Zapisz" }));

    expect(onSubmit).toHaveBeenCalledWith({
      firstName: "Jan",
      lastName: "Kowalski",
      email: null,
      phone: null,
    });
  });
});
