import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import LandingPage from "./LandingPage";

describe("LandingPage", () => {
  it("opens login modal after login button click", async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    expect(screen.queryByRole("heading", { name: "Logowanie" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(await screen.findByRole("heading", { name: "Logowanie" })).toBeInTheDocument();
  });
});
