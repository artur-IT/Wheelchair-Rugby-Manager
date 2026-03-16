import { describe, expect, it } from "vitest";

import { sanitizePhone } from "./validateInputs";

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
