import { describe, expect, it } from "vitest";
import {
  buildContactMapSearchUrl,
  computeAgeFromIsoDateString,
  extractClubApiErrorMessage,
  parseClubPlayerApiFieldMessages,
  resolveClubPlayerFieldErrorMessage,
} from "@/features/club/lib/clubPersonnelHelpers";

describe("clubPersonnelHelpers", () => {
  it("extractClubApiErrorMessage reads string error", () => {
    expect(extractClubApiErrorMessage({ error: "Błąd" }, "fallback")).toBe("Błąd");
  });

  it("extractClubApiErrorMessage prefixes field label and message", () => {
    expect(
      extractClubApiErrorMessage(
        {
          error: {
            formErrors: [],
            fieldErrors: { firstName: ["Za krótko"] },
          },
        },
        "fallback"
      )
    ).toBe("Imię: Za krótko");
  });

  it("extractClubApiErrorMessage replaces vague Zod default with a helpful hint", () => {
    expect(
      extractClubApiErrorMessage(
        {
          error: {
            formErrors: [],
            fieldErrors: { contactPostalCode: ["Nieprawidłowa wartość"] },
          },
        },
        "fallback"
      )
    ).toContain("Kod pocztowy:");
    expect(
      extractClubApiErrorMessage(
        {
          error: {
            formErrors: [],
            fieldErrors: { contactPostalCode: ["Nieprawidłowa wartość"] },
          },
        },
        "fallback"
      )
    ).toContain("XX-XXX");
  });

  it("extractClubApiErrorMessage maps vague speed error to skill hint (not postal/phone)", () => {
    const msg = extractClubApiErrorMessage(
      {
        error: {
          formErrors: [],
          fieldErrors: { speed: ["Nieprawidłowa wartość"] },
        },
      },
      "fallback"
    );
    expect(msg).toContain("Szybkość");
    expect(msg).toContain("ocenę");
    expect(msg).not.toContain("kod pocztowy");
  });

  it("parseClubPlayerApiFieldMessages returns all fields with resolved messages", () => {
    const map = parseClubPlayerApiFieldMessages({
      error: {
        formErrors: [],
        fieldErrors: {
          speed: ["Nieprawidłowa wartość"],
          contactPostalCode: ["Nieprawidłowa wartość"],
        },
      },
    });
    expect(map).toEqual({
      speed: resolveClubPlayerFieldErrorMessage("speed", "Nieprawidłowa wartość"),
      contactPostalCode: resolveClubPlayerFieldErrorMessage("contactPostalCode", "Nieprawidłowa wartość"),
    });
  });

  it("resolveClubPlayerFieldErrorMessage leaves explicit API messages unchanged", () => {
    expect(resolveClubPlayerFieldErrorMessage("contactPhone", "Telefon musi mieć 9 cyfr")).toBe(
      "Telefon musi mieć 9 cyfr"
    );
  });

  it("buildContactMapSearchUrl returns null when address parts empty", () => {
    expect(buildContactMapSearchUrl({})).toBeNull();
  });

  it("buildContactMapSearchUrl encodes Google Maps query like tournament venue address", () => {
    const url = buildContactMapSearchUrl({
      address: "Sportowa 1",
      postalCode: "80-001",
      city: "Gdańsk",
    });
    expect(url).toContain("google.com/maps/search");
    expect(url).toContain(encodeURIComponent("Sportowa 1, 80-001 Gdańsk"));
  });

  it("computeAgeFromIsoDateString returns full years", () => {
    const ref = new Date("2026-06-01T12:00:00.000Z");
    expect(computeAgeFromIsoDateString("2010-01-15T00:00:00.000Z", ref)).toBe(16);
  });
});
