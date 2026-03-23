import { describe, expect, it } from "vitest";

import {
  buildPlayerPayload,
  buildPlayerPayloadFromRow,
  normalizeText,
  parseOptionalNumber,
  toWebsiteHref,
} from "./teamFormUtils";

describe("teamFormUtils", () => {
  it("normalizes text and numbers from row payload", () => {
    const payload = buildPlayerPayloadFromRow({
      firstName: "  Jan ",
      lastName: " Kowalski  ",
      classification: "2,5",
      number: " 11 ",
    });

    expect(payload).toEqual({
      firstName: "Jan",
      lastName: "Kowalski",
      classification: 2.5,
      number: 11,
    });
  });

  it("returns undefined for empty or invalid optional numbers", () => {
    expect(parseOptionalNumber("")).toBeUndefined();
    expect(parseOptionalNumber("   ")).toBeUndefined();
    expect(parseOptionalNumber("abc")).toBeUndefined();
  });

  it("maps nullable player fields to optional payload fields", () => {
    const payload = buildPlayerPayload({
      firstName: "Anna",
      lastName: "Nowak",
      classification: null,
      number: null,
    });

    expect(payload).toEqual({
      firstName: "Anna",
      lastName: "Nowak",
      classification: undefined,
      number: undefined,
    });
  });

  it("normalizes helper values for text and website url", () => {
    expect(normalizeText("  test  ")).toBe("test");
    expect(normalizeText(undefined)).toBe("");
    expect(toWebsiteHref("example.com")).toBe("https://example.com");
    expect(toWebsiteHref("https://example.com")).toBe("https://example.com");
  });
});
