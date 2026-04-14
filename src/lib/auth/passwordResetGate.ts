/** Paths allowed while the user must set a new password (session present, flag set). */
const PASSWORD_RESET_EXEMPT_PATHS = new Set([
  "/reset-password",
  "/api/auth/password-reset-status",
  "/api/auth/complete-password-reset",
  "/api/logout",
]);

/** True when an authenticated user may access this path before clearing `mustResetPassword`. */
export function isPasswordResetExemptPath(pathname: string): boolean {
  return PASSWORD_RESET_EXEMPT_PATHS.has(pathname);
}
