-- Rename logoUrl to websiteUrl so DTOs stay consistent
ALTER TABLE "Team" RENAME COLUMN "logoUrl" TO "websiteUrl";
