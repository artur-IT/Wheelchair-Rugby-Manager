export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_WINDOW_MS = 5 * 60 * 1000;

export function isTemporarilyLocked(lockUntil: Date | null, now = new Date()): boolean {
  return lockUntil !== null && lockUntil > now;
}

export function computeFailedLoginState(
  failedLoginAttempts: number,
  now = new Date()
): { failedLoginAttempts: number; lockUntil: Date | null } {
  const nextFailedAttempts = failedLoginAttempts + 1;
  if (nextFailedAttempts < MAX_FAILED_LOGIN_ATTEMPTS) {
    return {
      failedLoginAttempts: nextFailedAttempts,
      lockUntil: null,
    };
  }

  return {
    failedLoginAttempts: nextFailedAttempts,
    lockUntil: new Date(now.getTime() + LOGIN_LOCK_WINDOW_MS),
  };
}

export function computeRemainingLoginAttempts(failedLoginAttempts: number): number {
  const remainingAttempts = MAX_FAILED_LOGIN_ATTEMPTS - failedLoginAttempts;
  if (remainingAttempts <= 0) {
    return 0;
  }
  return remainingAttempts;
}
