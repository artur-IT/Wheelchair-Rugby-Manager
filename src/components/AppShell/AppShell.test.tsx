import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signOutMock = vi.fn().mockResolvedValue(undefined);

vi.mock("supertokens-web-js/recipe/session", () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

vi.mock("@/lib/supertokens/initFrontend", () => ({
  ensureSuperTokensFrontendInitialized: vi.fn(),
}));

import AppShell from "./AppShell";

describe("AppShell", () => {
  beforeEach(() => {
    signOutMock.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => null,
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders navigation and page content", () => {
    render(
      <AppShell currentPath="/dashboard">
        <div>Test child content</div>
      </AppShell>
    );

    expect(screen.getAllByText("Wheelchair Rugby Manager").length).toBeGreaterThan(0);
    expect(screen.getByText("Test child content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Turnieje" })).toHaveAttribute("href", "/tournaments");
  });

  it("shows logged-in user name above version in menu", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: "Jan Kowalski" }),
      })
    );

    render(
      <AppShell currentPath="/dashboard">
        <div>Test child content</div>
      </AppShell>
    );

    expect(await screen.findByText("Zalogowany: Jan Kowalski")).toBeInTheDocument();
  });

  it("calls SuperTokens signOut when user clicks logout", async () => {
    const user = userEvent.setup();
    const assignMock = vi.fn();
    vi.stubGlobal("location", { ...window.location, href: "", assign: assignMock, replace: vi.fn() });

    render(
      <AppShell currentPath="/dashboard">
        <div>Test child content</div>
      </AppShell>
    );

    await user.click(screen.getByRole("button", { name: "Wyloguj" }));

    expect(signOutMock).toHaveBeenCalledTimes(1);
  });
});
