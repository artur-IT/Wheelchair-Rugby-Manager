import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchCurrentUserProfileMock = vi.fn();
const updateCurrentUserProfileMock = vi.fn();

vi.mock("@/lib/api/users", () => ({
  fetchCurrentUserProfile: (...args: unknown[]) => fetchCurrentUserProfileMock(...args),
  updateCurrentUserProfile: (...args: unknown[]) => updateCurrentUserProfileMock(...args),
}));

import ProfilePage from "./ProfilePage";

describe("ProfilePage", () => {
  beforeEach(() => {
    fetchCurrentUserProfileMock.mockReset();
    updateCurrentUserProfileMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads current user profile data", async () => {
    fetchCurrentUserProfileMock.mockResolvedValue({
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan@example.com",
    });

    render(<ProfilePage />);

    expect(await screen.findByDisplayValue("Jan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Kowalski")).toBeInTheDocument();
    expect(screen.getByText("jan@example.com")).toBeInTheDocument();
  });

  it("sends edited profile fields on submit", async () => {
    const user = userEvent.setup();
    fetchCurrentUserProfileMock.mockResolvedValue({
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan@example.com",
    });
    updateCurrentUserProfileMock.mockResolvedValue({
      firstName: "Anna",
      lastName: "Nowak",
      email: "jan@example.com",
    });

    render(<ProfilePage />);

    const firstNameField = await screen.findByLabelText("Imię");
    const lastNameField = screen.getByLabelText("Nazwisko");
    await user.clear(firstNameField);
    await user.type(firstNameField, "Anna");
    await user.clear(lastNameField);
    await user.type(lastNameField, "Nowak");
    await user.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));

    expect(updateCurrentUserProfileMock).toHaveBeenCalledWith({
      firstName: "Anna",
      lastName: "Nowak",
    });
    expect(await screen.findByText("Dane profilu zostały zapisane.")).toBeInTheDocument();
  });
});
