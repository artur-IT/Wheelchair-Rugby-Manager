import { describe, expect, it } from "vitest";

import {
  optionalWebsiteUrlSchema,
  requiredCitySchema,
  requiredPostalCodeSchema,
  sanitizePhone,
  toTitleCase,
} from "./validateInputs";

describe("toTitleCase", () => {
  it("capitalises first letter of each word", () => {
    expect(toTitleCase("artur mati")).toBe("Artur Mati");
  });

  it("lowercases ALL-CAPS input", () => {
    expect(toTitleCase("ARTUR MATI")).toBe("Artur Mati");
  });

  it("handles single word", () => {
    expect(toTitleCase("kowalski")).toBe("Kowalski");
  });

  it("trims leading and trailing spaces", () => {
    expect(toTitleCase("  jan  ")).toBe("Jan");
  });

  it("returns empty string for empty input", () => {
    expect(toTitleCase("")).toBe("");
  });

  it("handles Polish characters", () => {
    expect(toTitleCase("żory")).toBe("Żory");
    expect(toTitleCase("gdańsk")).toBe("Gdańsk");
    expect(toTitleCase("kraków")).toBe("Kraków");
  });
});

describe("sanitizePhone", () => {
  it("strips non-digit characters", () => {
    expect(sanitizePhone("abc123def")).toBe("123");
  });

  it("strips spaces, dashes and parentheses", () => {
    expect(sanitizePhone("(12) 345-6789")).toBe("123456789");
  });

  it("truncates to 9 digits when input is longer", () => {
    expect(sanitizePhone("1234567890")).toBe("123456789");
  });

  it("returns the value unchanged when it is exactly 9 digits", () => {
    expect(sanitizePhone("123456789")).toBe("123456789");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizePhone("")).toBe("");
  });

  it("returns empty string when input contains no digits", () => {
    expect(sanitizePhone("abcdef")).toBe("");
  });
});

describe("requiredCitySchema", () => {
  const valid = (v: string) => requiredCitySchema.safeParse(v).success;

  it("accepts a valid city name", () => expect(valid("Warszawa")).toBe(true));
  it("rejects empty string", () => expect(valid("")).toBe(false));
});

describe("requiredPostalCodeSchema", () => {
  const valid = (v: string) => requiredPostalCodeSchema.safeParse(v).success;

  it("accepts valid Polish postal code", () => expect(valid("00-001")).toBe(true));
  it("rejects empty string", () => expect(valid("")).toBe(false));
  it("rejects code without dash: 00001", () => expect(valid("00001")).toBe(false));
  it("rejects code with wrong format: 000-01", () => expect(valid("000-01")).toBe(false));
  it("rejects code with letters: AB-CDE", () => expect(valid("AB-CDE")).toBe(false));
});

describe("optionalWebsiteUrlSchema", () => {
  const valid = (v: string) => optionalWebsiteUrlSchema.safeParse(v).success;

  it("accepts empty string", () => expect(valid("")).toBe(true));
  it("accepts domain without protocol: wp.pl", () => expect(valid("wp.pl")).toBe(true));
  it("accepts www prefix: www.wp.pl", () => expect(valid("www.wp.pl")).toBe(true));
  it("accepts https URL", () => expect(valid("https://wp.pl")).toBe(true));
  it("accepts http URL", () => expect(valid("http://www.wp.pl/path")).toBe(true));
  it("rejects plain text without dot", () => expect(valid("notaurl")).toBe(false));
  it("rejects string with spaces", () => expect(valid("www.wp .pl")).toBe(false));
});
