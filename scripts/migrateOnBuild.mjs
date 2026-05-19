/* eslint-env node */
import { execSync } from "node:child_process";

function shouldRunMigrations() {
  // Vercel sets VERCEL_ENV to "production" / "preview" / "development"
  return process.env.VERCEL_ENV === "production";
}

if (!shouldRunMigrations()) {
  console.log("[prisma] Skip migrate deploy (not production build).");
} else {
  // Let Vercel use a separate DB user/role for migrations.
  // This prevents Prisma Studio (and the app) from being forced to use the
  // same "migration" role that may have stricter connection limits.
  const migrationUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!migrationUrl)
    throw new Error("MIGRATION_DATABASE_URL or DATABASE_URL is not set (required for prisma migrate deploy).");

  console.log("[prisma] Running prisma migrate deploy...");
  execSync("pnpm prisma migrate deploy", {
    stdio: "inherit",
    // Prisma CLI uses DATABASE_URL from the environment.
    env: { ...process.env, DATABASE_URL: migrationUrl },
  });
  console.log("[prisma] prisma migrate deploy done.");
}
