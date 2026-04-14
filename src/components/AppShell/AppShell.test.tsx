import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppShell from "./AppShell";

describe("AppShell", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === "/api/me") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              user: {
                id: "u1",
                name: "Test User",
                email: "test@example.com",
                localLogin: "tester",
                authProvider: "LOCAL",
              },
            }),
          });
        }
        return Promise.resolve({ ok: false, json: async () => ({}) });
      })
    );
  });

  it("renders navigation and page content", async () => {
    render(
      <AppShell currentPath="/dashboard">
        <div>Test child content</div>
      </AppShell>
    );

    expect(screen.getAllByText("Wheelchair Rugby Manager").length).toBeGreaterThan(0);
    expect(screen.getByText("Test child content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Turnieje" })).toHaveAttribute("href", "/tournaments");
    await waitFor(() => {
      expect(screen.getAllByText("Test User").length).toBeGreaterThan(0);
    });
  });

  it("calls logout endpoint when user clicks logout", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/me") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            user: {
              id: "u1",
              name: "Test User",
              email: "test@example.com",
              localLogin: "tester",
              authProvider: "LOCAL",
            },
          }),
        });
      }
      if (url === "/api/logout" && init?.method === "POST") {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AppShell currentPath="/dashboard">
        <div>Test child content</div>
      </AppShell>
    );

    await waitFor(() => {
      expect(screen.getAllByText("Test User").length).toBeGreaterThan(0);
    });

    await user.click(screen.getByRole("button", { name: "Wyloguj" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/logout", { method: "POST" });
  });
});
