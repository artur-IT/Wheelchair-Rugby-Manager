import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ResetPasswordPage from "./ResetPasswordPage";

describe("ResetPasswordPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows mandatory reset form when logged in with mustResetPassword", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ loggedIn: true, mustResetPassword: true }),
      })
    );

    render(<ResetPasswordPage />);

    expect(await screen.findByText(/Musisz ustalić nowe hasło/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zapisz nowe hasło/i })).toBeInTheDocument();
  });

  it("shows initial setup form when not logged in", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ loggedIn: false, mustResetPassword: false }),
      })
    );

    render(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Ustaw hasło/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/konto zostało przeniesione/i)).toBeInTheDocument();
  });
});
