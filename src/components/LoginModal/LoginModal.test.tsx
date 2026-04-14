import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/navigation/assignLocation", () => ({
  assignLocation: vi.fn(),
}));

import { assignLocation } from "@/lib/navigation/assignLocation";
import LoginModal from "./LoginModal";

describe("LoginModal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders login form when open", () => {
    render(<LoginModal open onClose={vi.fn()} onLoginSuccess={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Logowanie" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zaloguj nickiem" })).toBeInTheDocument();
  });

  it("shows error alert when login request fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ ok: false }) }));

    render(<LoginModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/Nick \(login\)/i), "admin");
    await user.type(screen.getByLabelText(/hasło/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Zaloguj nickiem" }));

    expect(await screen.findByText("Błędny nick lub hasło. Spróbuj ponownie.")).toBeInTheDocument();
  });

  it("disables submit button while login request is pending", async () => {
    const user = userEvent.setup();
    let resolveLogin: ((value: { json: () => Promise<{ ok: boolean }> }) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveLogin = resolve;
          })
      )
    );

    render(<LoginModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/Nick \(login\)/i), "admin");
    await user.type(screen.getByLabelText(/hasło/i), "demo-password");
    await user.click(screen.getByRole("button", { name: "Zaloguj nickiem" }));

    expect(screen.getByRole("button", { name: "Logowanie…" })).toBeDisabled();
    resolveLogin?.({ json: async () => ({ ok: true, mustResetPassword: false }) });
    await screen.findByRole("button", { name: "Zaloguj nickiem" });
  });

  it("redirects to password reset when server marks session as mustResetPassword", async () => {
    const user = userEvent.setup();
    vi.mocked(assignLocation).mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ ok: true, mustResetPassword: true }) })
    );
    const onLoginSuccess = vi.fn();

    render(<LoginModal open onClose={vi.fn()} onLoginSuccess={onLoginSuccess} />);

    await user.type(screen.getByLabelText(/Nick \(login\)/i), "admin");
    await user.type(screen.getByLabelText(/hasło/i), "demo-password");
    await user.click(screen.getByRole("button", { name: "Zaloguj nickiem" }));

    await waitFor(() => {
      expect(assignLocation).toHaveBeenCalledWith("/reset-password");
    });
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });

  it("submits login request and does not show error on success", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ ok: true, mustResetPassword: false }) });
    const onLoginSuccess = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginModal open onClose={vi.fn()} onLoginSuccess={onLoginSuccess} />);

    await user.type(screen.getByLabelText(/Nick \(login\)/i), "admin");
    await user.type(screen.getByLabelText(/hasło/i), "demo-password");
    await user.click(screen.getByRole("button", { name: "Zaloguj nickiem" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/login",
      expect.objectContaining({
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      })
    );
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Błędny nick lub hasło. Spróbuj ponownie.")).not.toBeInTheDocument();
  });

  it("re-enables submit button after successful login with custom callback", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ ok: true, mustResetPassword: false }) }));

    render(<LoginModal open onClose={vi.fn()} onLoginSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText(/Nick \(login\)/i), "admin");
    await user.type(screen.getByLabelText(/hasło/i), "demo-password");
    await user.click(screen.getByRole("button", { name: "Zaloguj nickiem" }));

    expect(await screen.findByRole("button", { name: "Zaloguj nickiem" })).not.toBeDisabled();
  });
});
