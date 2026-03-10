import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import ProfilePage from "./ProfilePage";

describe("ProfilePage", () => {
  it("allows editing profile form fields", async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    const firstNameInput = screen.getByDisplayValue("Admin");
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Mateusz");

    expect(screen.getByDisplayValue("Mateusz")).toBeInTheDocument();
  });
});
