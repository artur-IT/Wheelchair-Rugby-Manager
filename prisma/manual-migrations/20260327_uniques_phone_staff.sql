-- Manual migration to align existing data with new Prisma schema.
-- Applies:
-- - Season.year NOT NULL + UNIQUE
-- - Team (seasonId,name) UNIQUE
-- - Tournament (seasonId,name) UNIQUE
-- - Coach/Referee/Classifier phone NOT NULL + UNIQUE per season, digits-only already enforced at app layer
-- - Staff becomes season-scoped, unique per (seasonId,firstName,lastName) and many-to-many with Team

BEGIN;

-- 1) Backfill Season.year if any NULLs exist (use createdAt year as fallback).
UPDATE "Season"
SET "year" = COALESCE("year", DATE_PART('year', "createdAt")::INT)
WHERE "year" IS NULL;

-- 2) Backfill NULL/empty phones with deterministic 9-digit placeholders (per season).
WITH c AS (
  SELECT "id", "seasonId", ROW_NUMBER() OVER (PARTITION BY "seasonId" ORDER BY "id") AS rn
  FROM "Coach"
  WHERE "phone" IS NULL OR "phone" = ''
)
UPDATE "Coach" x
SET "phone" = LPAD((500000000 + c.rn)::TEXT, 9, '0')
FROM c
WHERE x."id" = c."id";

WITH r AS (
  SELECT "id", "seasonId", ROW_NUMBER() OVER (PARTITION BY "seasonId" ORDER BY "id") AS rn
  FROM "Referee"
  WHERE "phone" IS NULL OR "phone" = ''
)
UPDATE "Referee" x
SET "phone" = LPAD((600000000 + r.rn)::TEXT, 9, '0')
FROM r
WHERE x."id" = r."id";

WITH cl AS (
  SELECT "id", "seasonId", ROW_NUMBER() OVER (PARTITION BY "seasonId" ORDER BY "id") AS rn
  FROM "Classifier"
  WHERE "phone" IS NULL OR "phone" = ''
)
UPDATE "Classifier" x
SET "phone" = LPAD((700000000 + cl.rn)::TEXT, 9, '0')
FROM cl
WHERE x."id" = cl."id";

-- 3) Prepare Staff.seasonId without losing existing links to Team.
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "seasonId" TEXT;

UPDATE "Staff" s
SET "seasonId" = t."seasonId"
FROM "Team" t
WHERE s."teamId" = t."id"
  AND (s."seasonId" IS NULL OR s."seasonId" = '');

-- 4) Create join table for Staff↔Team if missing.
CREATE TABLE IF NOT EXISTS "_StaffToTeam" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_StaffToTeam_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX IF NOT EXISTS "_StaffToTeam_B_index" ON "_StaffToTeam"("B");

-- 5) Merge duplicate Staff rows per season+name into one "canonical" row.
WITH ranked AS (
  SELECT
    "id",
    "seasonId",
    "firstName",
    "lastName",
    FIRST_VALUE("id") OVER (PARTITION BY "seasonId","firstName","lastName" ORDER BY "id") AS keep_id
  FROM "Staff"
),
dup_map AS (
  SELECT "id" AS dup_id, keep_id
  FROM ranked
  WHERE "id" <> keep_id
)
-- 5a) Move tournament references to canonical staff
UPDATE "TournamentStaff" ts
SET "staffId" = m.keep_id
FROM dup_map m
WHERE ts."staffId" = m.dup_id;

-- 5b) Insert staff↔team links using canonical ids
WITH ranked AS (
  SELECT
    "id",
    "teamId",
    "seasonId",
    "firstName",
    "lastName",
    FIRST_VALUE("id") OVER (PARTITION BY "seasonId","firstName","lastName" ORDER BY "id") AS keep_id
  FROM "Staff"
)
INSERT INTO "_StaffToTeam" ("A","B")
SELECT r.keep_id, r."teamId"
FROM ranked r
ON CONFLICT DO NOTHING;

-- 5c) Delete duplicate staff rows (after moving refs)
WITH ranked AS (
  SELECT
    "id",
    "seasonId",
    "firstName",
    "lastName",
    FIRST_VALUE("id") OVER (PARTITION BY "seasonId","firstName","lastName" ORDER BY "id") AS keep_id
  FROM "Staff"
),
dup_map AS (
  SELECT "id" AS dup_id
  FROM ranked
  WHERE "id" <> keep_id
)
DELETE FROM "Staff" s
USING dup_map d
WHERE s."id" = d.dup_id;

-- 6) Drop old Staff.teamId relation and enforce new Staff.seasonId FK.
ALTER TABLE "Staff" DROP CONSTRAINT IF EXISTS "Staff_teamId_fkey";
ALTER TABLE "Staff" DROP COLUMN IF EXISTS "teamId";

ALTER TABLE "Staff" ALTER COLUMN "seasonId" SET NOT NULL;

ALTER TABLE "Staff"
ADD CONSTRAINT "Staff_seasonId_fkey"
FOREIGN KEY ("seasonId") REFERENCES "Season"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- 7) Enforce NOT NULL constraints for phone/year (after backfill).
ALTER TABLE "Season" ALTER COLUMN "year" SET NOT NULL;
ALTER TABLE "Coach" ALTER COLUMN "phone" SET NOT NULL;
ALTER TABLE "Referee" ALTER COLUMN "phone" SET NOT NULL;
ALTER TABLE "Classifier" ALTER COLUMN "phone" SET NOT NULL;

-- 8) Add unique constraints (will fail if duplicates exist).
CREATE UNIQUE INDEX IF NOT EXISTS "Season_year_key" ON "Season"("year");
CREATE UNIQUE INDEX IF NOT EXISTS "Team_seasonId_name_key" ON "Team"("seasonId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "Tournament_seasonId_name_key" ON "Tournament"("seasonId", "name");

CREATE UNIQUE INDEX IF NOT EXISTS "Coach_seasonId_phone_key" ON "Coach"("seasonId", "phone");
CREATE UNIQUE INDEX IF NOT EXISTS "Referee_seasonId_phone_key" ON "Referee"("seasonId", "phone");
CREATE UNIQUE INDEX IF NOT EXISTS "Classifier_seasonId_phone_key" ON "Classifier"("seasonId", "phone");

CREATE UNIQUE INDEX IF NOT EXISTS "Staff_seasonId_firstName_lastName_key" ON "Staff"("seasonId", "firstName", "lastName");

-- 9) Add join table foreign keys.
ALTER TABLE "_StaffToTeam"
ADD CONSTRAINT "_StaffToTeam_A_fkey" FOREIGN KEY ("A") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_StaffToTeam"
ADD CONSTRAINT "_StaffToTeam_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

