import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { act } from "react-dom/test-utils";
import ProfilePage from "./ProfilePage";

describe("ProfilePage SSR hydration", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
                name: "Profil User",
                email: "profile@example.com",
                localLogin: "prof",
                authProvider: "LOCAL",
              },
            }),
          });
        }
        return Promise.resolve({ ok: false, json: async () => ({}) });
      })
    );
  });

  it("hydrates without throwing (server HTML matches client)", () => {
    const markup = renderToString(<ProfilePage />);
    const container = document.createElement("div");
    container.innerHTML = markup;
    document.body.appendChild(container);

    const err = vi.spyOn(console, "error").mockImplementation((...args) => {
      console.log("console.error", args);
      return undefined;
    });

    act(() => {
      hydrateRoot(container, <ProfilePage />);
    });

    const hydrationErrors = err.mock.calls
      .map((c) => String(c[0] ?? ""))
      .filter((m) => m.includes("Hydration") || m.includes("hydration"));
    err.mockRestore();

    expect(hydrationErrors, hydrationErrors.join("\n")).toEqual([]);
  });
});
