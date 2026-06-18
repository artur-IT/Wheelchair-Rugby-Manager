import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import LandingPage from "./LandingPage";

describe("LandingPage", () => {
  it("opens login modal when initialLoginOpen is true", () => {
    render(<LandingPage initialLoginOpen />);

    expect(screen.getByRole("heading", { name: "Logowanie" })).toBeInTheDocument();
  });

  it("opens login modal after CTA click (nav login may be hidden on mobile portrait)", async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    expect(screen.queryByRole("heading", { name: "Logowanie" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Rozpocznij teraz" }));

    expect(await screen.findByRole("heading", { name: "Logowanie" })).toBeInTheDocument();
  });
});
