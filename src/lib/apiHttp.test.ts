import { describe, expect, it } from "vitest";
import { httpStatusFallbackMessage, parseApiErrorBody, parseFormErrorFromResponse } from "@/lib/apiHttp";

describe("parseApiErrorBody", () => {
  it("returns plain string error", () => {
    expect(parseApiErrorBody({ error: "Błąd serwera" })).toBe("Błąd serwera");
  });

  it("returns first form error from nested shape", () => {
    expect(parseApiErrorBody({ error: { formErrors: ["Pierwszy"], fieldErrors: {} } })).toBe("Pierwszy");
  });

  it("returns first field error from nested shape", () => {
    expect(
      parseApiErrorBody({
        error: { fieldErrors: { name: ["Nieprawidłowa nazwa"] }, formErrors: [] },
      })
    ).toBe("Nieprawidłowa nazwa");
  });

  it("returns null for empty object", () => {
    expect(parseApiErrorBody({})).toBe(null);
  });
});

describe("parseFormErrorFromResponse", () => {
  it("prefers formErrors over fallback", async () => {
    const res = new Response(JSON.stringify({ error: { formErrors: ["Złe pole"] } }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseFormErrorFromResponse(res, "fallback")).resolves.toBe("Złe pole");
  });
});

describe("httpStatusFallbackMessage", () => {
  it("maps 500 to server message", () => {
    expect(httpStatusFallbackMessage({ status: 500 } as Response)).toContain("Serwer");
  });

  it("includes status code for other errors", () => {
    expect(httpStatusFallbackMessage({ status: 418 } as Response)).toContain("418");
  });
});
