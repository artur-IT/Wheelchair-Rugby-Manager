import argon2 from "argon2";

/**
 * Hash password for storage in Prisma (Argon2id).
 */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

/**
 * Verify password against Prisma value.
 * Supports Argon2 hashes and legacy plaintext (demo seeds) for migration.
 */
export async function verifyStoredPassword(stored: string, plain: string): Promise<boolean> {
  if (stored.startsWith("$argon")) {
    try {
      return await argon2.verify(stored, plain);
    } catch {
      return false;
    }
  }
  return stored === plain;
}

/**
 * Random password for OAuth-only users (never used for email login).
 */
export async function randomUnusedPasswordHash(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return hashPassword(`oauth-placeholder:${token}`);
}
