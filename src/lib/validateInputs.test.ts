import { describe, expect, it } from "vitest";

import {
  optionalMapLinkSchema,
  optionalWebsiteUrlSchema,
  requiredCateringSchema,
  requiredCitySchema,
  requiredHallNameSchema,
  requiredHotelNameSchema,
  requiredPostalCodeSchema,
  requiredTournamentNameSchema,
  sanitizePhone,
  toTitleCase,
  tournamentFormSchema,
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

describe("requiredTournamentNameSchema", () => {
  const valid = (v: string) => requiredTournamentNameSchema.safeParse(v).success;

  it("accepts valid tournament name", () => expect(valid("Turniej Jesienny")).toBe(true));
  it("rejects empty string", () => expect(valid("")).toBe(false));
  it("rejects name with less than 3 characters", () => expect(valid("AB")).toBe(false));
});

describe("requiredHotelNameSchema", () => {
  const valid = (v: string) => requiredHotelNameSchema.safeParse(v).success;

  it("accepts valid hotel name", () => expect(valid("Hotel Centrum")).toBe(true));
  it("rejects empty string", () => expect(valid("")).toBe(false));
  it("rejects name with less than 3 characters", () => expect(valid("AB")).toBe(false));
});

describe("requiredHallNameSchema", () => {
  const valid = (v: string) => requiredHallNameSchema.safeParse(v).success;

  it("accepts valid hall name", () => expect(valid("Hala Sportowa")).toBe(true));
  it("rejects empty string", () => expect(valid("")).toBe(false));
  it("rejects name with less than 3 characters", () => expect(valid("AB")).toBe(false));
});

describe("requiredCateringSchema", () => {
  const valid = (v: string) => requiredCateringSchema.safeParse(v).success;

  it("accepts valid catering description", () => expect(valid("Hotel + Catering na hali")).toBe(true));
  it("rejects empty string", () => expect(valid("")).toBe(false));
  it("rejects description with less than 3 characters", () => expect(valid("AB")).toBe(false));
});

describe("optionalMapLinkSchema", () => {
  const valid = (v: string) => optionalMapLinkSchema.safeParse(v).success;

  it("accepts empty string", () => expect(valid("")).toBe(true));
  it("accepts https URL", () => expect(valid("https://maps.google.com")).toBe(true));
  it("rejects invalid URL", () => expect(valid("notaurl")).toBe(false));
});

describe("tournamentFormSchema", () => {
  it("accepts valid tournament data", () => {
    const validData = {
      name: "Turniej Jesienny",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-09-03"),
      hotel: "Hotel Centrum",
      city: "Warszawa",
      zipCode: "00-001",
      street: "Ulica Główna 1",
      mapLink: "https://maps.google.com",
      catering: "Hotel + Catering",
      hallName: "Hala Sportowa",
      hallMapLink: "https://maps.google.com/hala",
    };
    expect(tournamentFormSchema.safeParse(validData).success).toBe(true);
  });

  it("rejects when endDate is before startDate", () => {
    const invalidData = {
      name: "Turniej Jesienny",
      startDate: new Date("2026-09-03"),
      endDate: new Date("2026-09-01"),
      hotel: "Hotel Centrum",
      city: "Warszawa",
      zipCode: "00-001",
      street: "Ulica Główna 1",
      mapLink: "",
      catering: "Hotel + Catering",
      hallName: "Hala Sportowa",
      hallMapLink: "",
    };
    expect(tournamentFormSchema.safeParse(invalidData).success).toBe(false);
  });
});
