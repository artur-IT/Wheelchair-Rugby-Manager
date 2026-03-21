import { describe, expect, it } from "vitest";

import {
  buildGoogleMapsSearchUrl,
  formatAddressForDisplay,
  getAddressLines,
  resolveMapsHref,
  resolvePlaceMapsHref,
} from "./addressDisplay";

describe("getAddressLines", () => {
  it("splits street and city line at the first comma", () => {
    expect(getAddressLines("ul. Sportowa 1, 00-001 Warszawa")).toEqual(["ul. Sportowa 1", "00-001 Warszawa"]);
  });

  it("trims spaces around parts", () => {
    expect(getAddressLines("  ul. A 1 ,  00-002 Miasto  ")).toEqual(["ul. A 1", "00-002 Miasto"]);
  });

  it("returns a single line when there is no comma", () => {
    expect(getAddressLines("ul. Bez przecinka")).toEqual(["ul. Bez przecinka"]);
  });

  it("returns empty array for whitespace-only input", () => {
    expect(getAddressLines("   ")).toEqual([]);
  });
});

describe("formatAddressForDisplay", () => {
  it("title-cases each line of a comma-separated address", () => {
    expect(formatAddressForDisplay("ul. sportowa 1, 00-001 warszawa")).toBe("Ul. Sportowa 1\n00-001 Warszawa");
  });

  it("joins lines with comma+space when requested", () => {
    expect(formatAddressForDisplay("ul. a 1, 00-002 miasto", ", ")).toBe("Ul. A 1, 00-002 Miasto");
  });

  it("returns empty string for missing or blank address", () => {
    expect(formatAddressForDisplay(undefined)).toBe("");
    expect(formatAddressForDisplay("   ")).toBe("");
  });
});

describe("buildGoogleMapsSearchUrl", () => {
  it("joins name and address and encodes the query", () => {
    expect(buildGoogleMapsSearchUrl({ name: "Hotel Sport", address: "ul. A 1, 00-001 Warszawa" })).toBe(
      "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Hotel Sport, ul. A 1, 00-001 Warszawa")
    );
  });

  it("returns null when both name and address are empty", () => {
    expect(buildGoogleMapsSearchUrl({ name: "", address: "   " })).toBeNull();
  });
});

describe("resolveMapsHref", () => {
  it("uses manual mapUrl when provided", () => {
    expect(
      resolveMapsHref({
        mapUrl: "https://example.com/pin",
        name: "Hotel",
        address: "ul. 1",
      })
    ).toBe("https://example.com/pin");
  });

  it("falls back to generated search URL when mapUrl is missing", () => {
    expect(resolveMapsHref({ name: "Hotel", address: "Miasto" })).toBe(
      "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Hotel, Miasto")
    );
  });
});

describe("resolvePlaceMapsHref", () => {
  it("returns null when place is undefined", () => {
    expect(resolvePlaceMapsHref(undefined)).toBeNull();
  });

  it("delegates to resolveMapsHref when place is defined", () => {
    expect(resolvePlaceMapsHref({ name: "Hala", address: "ul. 1" })).toBe(
      "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Hala, ul. 1")
    );
  });
});
