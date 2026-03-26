-- Add structured catering fields directly on Tournament.
ALTER TABLE "Tournament"
ADD COLUMN "catering" TEXT,
ADD COLUMN "breakfastServingTime" TEXT,
ADD COLUMN "breakfastLocation" "MealLocation",
ADD COLUMN "lunchServingTime" TEXT,
ADD COLUMN "lunchLocation" "MealLocation",
ADD COLUMN "dinnerServingTime" TEXT,
ADD COLUMN "dinnerLocation" "MealLocation",
ADD COLUMN "cateringNotes" TEXT;

-- Backfill legacy summary from the first non-empty meal plan details.
UPDATE "Tournament" t
SET "catering" = src.details
FROM (
  SELECT DISTINCT ON ("tournamentId")
    "tournamentId",
    "details"
  FROM "MealPlan"
  WHERE COALESCE(TRIM("details"), '') <> ''
  ORDER BY "tournamentId", "createdAt" ASC
) src
WHERE t."id" = src."tournamentId"
  AND COALESCE(TRIM(t."catering"), '') = '';
