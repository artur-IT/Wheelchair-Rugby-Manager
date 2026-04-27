-- Remove unused enum variant after legacy MealPlan removal.
ALTER TYPE "MealLocation" RENAME TO "MealLocation_old";

CREATE TYPE "MealLocation" AS ENUM ('HALL', 'HOTEL');

ALTER TABLE "Tournament"
ALTER COLUMN "breakfastLocation" TYPE "MealLocation"
USING ("breakfastLocation"::text::"MealLocation"),
ALTER COLUMN "lunchLocation" TYPE "MealLocation"
USING ("lunchLocation"::text::"MealLocation"),
ALTER COLUMN "dinnerLocation" TYPE "MealLocation"
USING ("dinnerLocation"::text::"MealLocation");

DROP TYPE "MealLocation_old";
