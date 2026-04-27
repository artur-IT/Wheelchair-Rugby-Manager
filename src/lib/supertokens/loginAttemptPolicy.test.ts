import { describe, expect, it } from "vitest";
import {
  computeFailedLoginState,
  computeRemainingLoginAttempts,
  isTemporarilyLocked,
  LOGIN_LOCK_WINDOW_MS,
  MAX_FAILED_LOGIN_ATTEMPTS,
} from "@/lib/supertokens/loginAttemptPolicy";

describe("loginAttemptPolicy", () => {
  it("increments attempts without lock before threshold", () => {
    const now = new Date("2026-01-01T12:00:00.000Z");
    const result = computeFailedLoginState(MAX_FAILED_LOGIN_ATTEMPTS - 2, now);

    expect(result.failedLoginAttempts).toBe(MAX_FAILED_LOGIN_ATTEMPTS - 1);
    expect(result.lockUntil).toBeNull();
  });

  it("sets lockUntil when threshold is reached", () => {
    const now = new Date("2026-01-01T12:00:00.000Z");
    const result = computeFailedLoginState(MAX_FAILED_LOGIN_ATTEMPTS - 1, now);

    expect(result.failedLoginAttempts).toBe(MAX_FAILED_LOGIN_ATTEMPTS);
    expect(result.lockUntil?.toISOString()).toBe(new Date(now.getTime() + LOGIN_LOCK_WINDOW_MS).toISOString());
  });

  it("detects temporary lock by timestamp", () => {
    const now = new Date("2026-01-01T12:00:00.000Z");

    expect(isTemporarilyLocked(new Date(now.getTime() + 1000), now)).toBe(true);
    expect(isTemporarilyLocked(now, now)).toBe(false);
    expect(isTemporarilyLocked(null, now)).toBe(false);
  });

  it("calculates remaining attempts and clamps at zero", () => {
    expect(computeRemainingLoginAttempts(0)).toBe(MAX_FAILED_LOGIN_ATTEMPTS);
    expect(computeRemainingLoginAttempts(MAX_FAILED_LOGIN_ATTEMPTS - 1)).toBe(1);
    expect(computeRemainingLoginAttempts(MAX_FAILED_LOGIN_ATTEMPTS)).toBe(0);
    expect(computeRemainingLoginAttempts(MAX_FAILED_LOGIN_ATTEMPTS + 1)).toBe(0);
  });
});
