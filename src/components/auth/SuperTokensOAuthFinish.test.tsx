import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInAndUpMock = vi.fn();

vi.mock("supertokens-web-js/recipe/thirdparty", () => ({
  signInAndUp: (...args: unknown[]) => signInAndUpMock(...args),
}));

vi.mock("@/lib/supertokens/initFrontend", () => ({
  ensureSuperTokensFrontendInitialized: vi.fn(),
}));

import SuperTokensOAuthFinish from "./SuperTokensOAuthFinish";

describe("SuperTokensOAuthFinish", () => {
  beforeEach(() => {
    signInAndUpMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows backend reason when google sign-up is not allowed", async () => {
    signInAndUpMock.mockResolvedValue({
      status: "SIGN_IN_UP_NOT_ALLOWED",
      reason: "Konto z tym adresem e-mail już istnieje.",
    });

    render(<SuperTokensOAuthFinish />);

    expect(await screen.findByText("Konto z tym adresem e-mail już istnieje.")).toBeInTheDocument();
  });

  it("shows fallback message when google sign-up flow is rejected without reason", async () => {
    signInAndUpMock.mockResolvedValue({ status: "SIGN_IN_UP_NOT_ALLOWED", reason: "" });

    render(<SuperTokensOAuthFinish />);

    expect(
      await screen.findByText("Ten e-mail jest już używany przez inne konto. Zaloguj się e-mailem i hasłem.")
    ).toBeInTheDocument();
  });
});
