-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- AlterTable: add status to Match
ALTER TABLE "Match" ADD COLUMN "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED';

-- AlterTable: add scheduling/result fields to ClassificationExam
ALTER TABLE "ClassificationExam" ADD COLUMN "scheduledAt" TIMESTAMP(3),
ADD COLUMN "location" TEXT,
ADD COLUMN "result" DOUBLE PRECISION;

-- AlterTable: add mapUrl to SportsHall and Accommodation
ALTER TABLE "SportsHall" ADD COLUMN "mapUrl" TEXT;
ALTER TABLE "Accommodation" ADD COLUMN "mapUrl" TEXT;

-- CreateIndex: unique player number per team
CREATE UNIQUE INDEX "Player_teamId_number_key" ON "Player"("teamId", "number");
