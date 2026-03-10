import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import AppShell from "./AppShell";

describe("AppShell", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders navigation and page content", () => {
    render(
      <AppShell currentPath="/dashboard">
        <div>Test child content</div>
      </AppShell>
    );

    expect(screen.getByText("Wheelchair Rugby")).toBeInTheDocument();
    expect(screen.getByText("Test child content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Turnieje" })).toHaveAttribute("href", "/tournaments");
  });

  it("calls logout endpoint when user clicks logout", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AppShell currentPath="/dashboard">
        <div>Test child content</div>
      </AppShell>
    );

    await user.click(screen.getByRole("button", { name: "Wyloguj" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/logout", { method: "POST" });
  });
});
