import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInMock = vi.fn();
const signUpMock = vi.fn();
const getAuthUrlMock = vi.fn();

vi.mock("supertokens-web-js/recipe/emailpassword", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
  signUp: (...args: unknown[]) => signUpMock(...args),
}));

vi.mock("supertokens-web-js/recipe/thirdparty", () => ({
  getAuthorisationURLWithQueryParamsAndSetState: (...args: unknown[]) => getAuthUrlMock(...args),
}));

vi.mock("@/lib/supertokens/initFrontend", () => ({
  ensureSuperTokensFrontendInitialized: vi.fn(),
}));

import LoginModal from "./LoginModal";

describe("LoginModal", () => {
  beforeEach(() => {
    signInMock.mockReset();
    signUpMock.mockReset();
    getAuthUrlMock.mockReset();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ conflict: false }) }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders login form when open", () => {
    render(<LoginModal open onClose={vi.fn()} onLoginSuccess={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Logowanie" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zaloguj" })).toBeInTheDocument();
  });

  it("shows error alert when signIn fails", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ status: "WRONG_CREDENTIALS_ERROR" });

    render(<LoginModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/E-mail/i), "admin@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Zaloguj" }));

    expect(await screen.findByText("Błędny adres e-mail lub hasło. Spróbuj ponownie.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nie pamiętasz hasła? Zresetuj" })).toHaveAttribute(
      "href",
      "/auth/reset-password"
    );
  });

  it("blocks google redirect when typed email is already used", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        conflict: true,
        message: "Konto z tym adresem e-mail już istnieje.",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/E-mail/i), "admin@example.com");
    await user.click(screen.getByRole("button", { name: "Kontynuuj z Google" }));

    expect(await screen.findByText("Konto z tym adresem e-mail już istnieje.")).toBeInTheDocument();
    expect(getAuthUrlMock).not.toHaveBeenCalled();
  });

  it("shows remaining attempts from backend metadata", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ status: "WRONG_CREDENTIALS_ERROR", remainingAttempts: 2, maxAttempts: 5 });

    render(<LoginModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/E-mail/i), "admin@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Zaloguj" }));

    expect(await screen.findByText("Błędny adres e-mail lub hasło. Pozostałe próby: 2.")).toBeInTheDocument();
  });

  it("shows temporary lock message with unlock time when backend reports lockUntil", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({
      status: "WRONG_CREDENTIALS_ERROR",
      remainingAttempts: 0,
      maxAttempts: 5,
      lockUntil: "2026-01-01T14:30:00.000Z",
    });

    render(<LoginModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/E-mail/i), "admin@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Zaloguj" }));

    const expectedTime = new Date("2026-01-01T14:30:00.000Z").toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    expect(await screen.findByText(new RegExp(`Spróbuj ponownie o ${expectedTime}\\.$`))).toBeInTheDocument();
  });

  it("shows computed unlock time when backend reports zero attempts without lockUntil", async () => {
    const user = userEvent.setup();
    const baseNowMs = new Date("2026-01-01T12:00:00.000Z").getTime();
    vi.spyOn(Date, "now").mockReturnValue(baseNowMs);
    signInMock.mockResolvedValue({ status: "WRONG_CREDENTIALS_ERROR", remainingAttempts: 0, maxAttempts: 5 });

    render(<LoginModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/E-mail/i), "admin@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Zaloguj" }));

    const expectedTime = new Date(baseNowMs + 5 * 60 * 1000).toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    expect(await screen.findByText(new RegExp(`Spróbuj ponownie o ${expectedTime}\\.$`))).toBeInTheDocument();
  });

  it("shows warning after repeated failed sign-in attempts", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ status: "WRONG_CREDENTIALS_ERROR" });

    render(<LoginModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/E-mail/i), "admin@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "wrong-password");

    await user.click(screen.getByRole("button", { name: "Zaloguj" }));
    await screen.findByText("Błędny adres e-mail lub hasło. Spróbuj ponownie.");

    await user.click(screen.getByRole("button", { name: "Zaloguj" }));
    await screen.findByText("Błędny adres e-mail lub hasło. Spróbuj ponownie.");

    await user.click(screen.getByRole("button", { name: "Zaloguj" }));
    expect(
      await screen.findByText(
        "Błędny adres e-mail lub hasło. Pozostałe próby: 2. Uwaga: po kilku błędnych próbach konto może zostać czasowo zablokowane."
      )
    ).toBeInTheDocument();
  });

  it("shows fallback unlock time after many failed sign-in attempts", async () => {
    const user = userEvent.setup();
    const baseNowMs = new Date("2026-01-01T10:00:00.000Z").getTime();
    vi.spyOn(Date, "now").mockReturnValue(baseNowMs);
    signInMock.mockResolvedValue({ status: "WRONG_CREDENTIALS_ERROR" });

    render(<LoginModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/E-mail/i), "admin@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "wrong-password");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await user.click(screen.getByRole("button", { name: "Zaloguj" }));
    }

    const expectedTime = new Date(baseNowMs + 5 * 60 * 1000).toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    expect(await screen.findByText(new RegExp(`Spróbuj ponownie o ${expectedTime}\\.$`))).toBeInTheDocument();
  });

  it("disables submit button while login request is pending", async () => {
    const user = userEvent.setup();
    let resolveSignIn: ((v: { status: string }) => void) | undefined;
    signInMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
    );

    render(<LoginModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/E-mail/i), "admin@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "demo-password");
    await user.click(screen.getByRole("button", { name: "Zaloguj" }));

    expect(screen.getByRole("button", { name: "Przetwarzanie…" })).toBeDisabled();
    resolveSignIn?.({ status: "OK" });
    await screen.findByRole("button", { name: "Zaloguj" });
  });

  it("submits signIn and calls onLoginSuccess", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ status: "OK" });
    const onLoginSuccess = vi.fn();

    render(<LoginModal open onClose={vi.fn()} onLoginSuccess={onLoginSuccess} />);

    await user.type(screen.getByLabelText(/E-mail/i), "admin@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "demo-password");
    await user.click(screen.getByRole("button", { name: "Zaloguj" }));

    expect(signInMock).toHaveBeenCalled();
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Błędny adres e-mail lub hasło. Spróbuj ponownie.")).not.toBeInTheDocument();
  });

  it("shows password-specific message when signup password is invalid", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue({
      status: "FIELD_ERROR",
      formFields: [{ id: "password", error: "Hasło musi mieć co najmniej 8 znaków." }],
    });

    render(<LoginModal open onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Nowe konto" }));
    await user.type(screen.getByLabelText(/E-mail/i), "player@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "short");
    await user.click(screen.getByRole("button", { name: "Utwórz konto" }));

    expect(await screen.findByText("Błąd hasła: Hasło musi mieć co najmniej 8 znaków.")).toBeInTheDocument();
  });

  it("shows email-specific message when signup email is invalid", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue({
      status: "FIELD_ERROR",
      formFields: [{ id: "email", error: "Podaj poprawny adres e-mail." }],
    });

    render(<LoginModal open onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Nowe konto" }));
    await user.type(screen.getByLabelText(/E-mail/i), "player@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "good-password");
    await user.click(screen.getByRole("button", { name: "Utwórz konto" }));

    expect(await screen.findByText("Błąd adresu e-mail: Podaj poprawny adres e-mail.")).toBeInTheDocument();
  });
});
