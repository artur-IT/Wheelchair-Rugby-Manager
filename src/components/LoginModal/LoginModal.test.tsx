import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import LoginModal from "./LoginModal";

describe("LoginModal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders login form when open", () => {
    render(<LoginModal open onClose={vi.fn()} onLoginSuccess={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Logowanie" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zaloguj" })).toBeInTheDocument();
  });

  it("shows error alert when login request fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ ok: false }) }));

    render(<LoginModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/PIN/i), "0000");
    await user.click(screen.getByRole("button", { name: "Zaloguj" }));

    expect(await screen.findByText("Błędny PIN / hasło. Spróbuj ponownie.")).toBeInTheDocument();
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

    await user.type(screen.getByLabelText(/PIN/i), "1234");
    await user.click(screen.getByRole("button", { name: "Zaloguj" }));

    expect(screen.getByRole("button", { name: "Logowanie…" })).toBeDisabled();
    resolveLogin?.({ json: async () => ({ ok: true }) });
    await screen.findByRole("button", { name: "Zaloguj" });
  });

  it("submits login request and does not show error on success", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ ok: true }) });
    const onLoginSuccess = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginModal open onClose={vi.fn()} onLoginSuccess={onLoginSuccess} />);

    await user.type(screen.getByLabelText(/PIN/i), "1234");
    await user.click(screen.getByRole("button", { name: "Zaloguj" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/login",
      expect.objectContaining({ method: "POST", headers: { Accept: "application/json" } })
    );
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Błędny PIN / hasło. Spróbuj ponownie.")).not.toBeInTheDocument();
  });

  it("re-enables submit button after successful login with custom callback", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ ok: true }) }));

    render(<LoginModal open onClose={vi.fn()} onLoginSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText(/PIN/i), "1234");
    await user.click(screen.getByRole("button", { name: "Zaloguj" }));

    expect(await screen.findByRole("button", { name: "Zaloguj" })).not.toBeDisabled();
  });
});
