import { describe, expect, it } from "vitest";
import {
  AUTH_VALIDATION,
  validateAuthEmail,
  validateAuthPassword,
  validateSignUpCredentials,
} from "@/lib/supertokens/authValidation";

describe("authValidation", () => {
  it("accepts a valid email", () => {
    expect(validateAuthEmail("player@example.com")).toBeNull();
  });

  it("rejects an email longer than configured max", () => {
    const tooLongEmail = `${"a".repeat(AUTH_VALIDATION.EMAIL_MAX_LENGTH)}@x.pl`;
    expect(validateAuthEmail(tooLongEmail)).toContain(`${AUTH_VALIDATION.EMAIL_MAX_LENGTH}`);
  });

  it("rejects password shorter than configured min", () => {
    const tooShortPassword = "x".repeat(AUTH_VALIDATION.PASSWORD_MIN_LENGTH - 1);
    expect(validateAuthPassword(tooShortPassword)).toContain(`${AUTH_VALIDATION.PASSWORD_MIN_LENGTH}`);
  });

  it("accepts password with configured min length", () => {
    const validPassword = "x".repeat(AUTH_VALIDATION.PASSWORD_MIN_LENGTH);
    expect(validateAuthPassword(validPassword)).toBeNull();
  });

  it("validates signup credentials in order", () => {
    const invalidEmailResult = validateSignUpCredentials(
      "not-an-email",
      "x".repeat(AUTH_VALIDATION.PASSWORD_MIN_LENGTH)
    );
    expect(invalidEmailResult).toContain("poprawny adres e-mail");

    const invalidPasswordResult = validateSignUpCredentials("player@example.com", "short");
    expect(invalidPasswordResult).toContain(`co najmniej ${AUTH_VALIDATION.PASSWORD_MIN_LENGTH}`);
  });
});
