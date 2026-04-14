import { describe, expect, it } from "vitest";

import { isPasswordResetExemptPath } from "./passwordResetGate";

describe("isPasswordResetExemptPath", () => {
  it("returns true for password-reset flow paths", () => {
    expect(isPasswordResetExemptPath("/reset-password")).toBe(true);
    expect(isPasswordResetExemptPath("/api/auth/password-reset-status")).toBe(true);
    expect(isPasswordResetExemptPath("/api/auth/complete-password-reset")).toBe(true);
    expect(isPasswordResetExemptPath("/api/logout")).toBe(true);
  });

  it("returns false for normal app routes", () => {
    expect(isPasswordResetExemptPath("/dashboard")).toBe(false);
    expect(isPasswordResetExemptPath("/settings")).toBe(false);
  });
});
