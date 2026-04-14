import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { navigate } from "astro:transitions/client";

import LandingPage from "./LandingPage";

describe("LandingPage", () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it("navigates to register without using a plain full-page anchor", async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    await user.click(screen.getByRole("button", { name: "Załóż konto" }));

    expect(navigate).toHaveBeenCalledWith("/register");
  });

  it("opens login modal after login button click", async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    expect(screen.queryByRole("heading", { name: "Logowanie" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(await screen.findByRole("heading", { name: "Logowanie" })).toBeInTheDocument();
  });
});
