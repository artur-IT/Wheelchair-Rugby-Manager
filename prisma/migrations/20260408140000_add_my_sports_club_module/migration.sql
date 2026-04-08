-- CreateEnum
CREATE TYPE "ClubTeamFormula" AS ENUM ('WR4', 'WR5');

-- CreateEnum
CREATE TYPE "ClubPersonRole" AS ENUM ('VOLUNTEER', 'REFEREE', 'OTHER');

-- CreateEnum
CREATE TYPE "ClubPlayerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GUEST');

-- CreateEnum
CREATE TYPE "ClubPlayerFunction" AS ENUM ('DEFENSE', 'ATTACK');

-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_teamId_fkey";

-- AlterTable
ALTER TABLE "Classifier" ALTER COLUMN "phone" SET NOT NULL;

-- AlterTable
ALTER TABLE "Coach" ALTER COLUMN "phone" SET NOT NULL;

-- AlterTable
ALTER TABLE "Referee" ALTER COLUMN "phone" SET NOT NULL;

-- AlterTable
ALTER TABLE "Season" ALTER COLUMN "year" SET NOT NULL;

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "teamId",
ADD COLUMN     "seasonId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactAddress" TEXT,
    "contactCity" TEXT,
    "contactPostalCode" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "contactFirstName" TEXT,
    "contactLastName" TEXT,
    "hallName" TEXT,
    "hallAddress" TEXT,
    "hallCity" TEXT,
    "hallPostalCode" TEXT,
    "hallMapUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerUserId" TEXT NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formula" "ClubTeamFormula" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clubId" TEXT NOT NULL,
    "coachId" TEXT,

    CONSTRAINT "ClubTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubPlayer" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "classification" DOUBLE PRECISION,
    "number" INTEGER,
    "status" "ClubPlayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "birthDate" TIMESTAMP(3),
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactAddress" TEXT,
    "contactCity" TEXT,
    "contactPostalCode" TEXT,
    "contactMapUrl" TEXT,
    "playerFunction" "ClubPlayerFunction",
    "speed" INTEGER,
    "strength" INTEGER,
    "endurance" INTEGER,
    "technique" INTEGER,
    "mentality" INTEGER,
    "height" INTEGER,
    "tactics" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clubId" TEXT NOT NULL,

    CONSTRAINT "ClubPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubCoach" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clubId" TEXT NOT NULL,

    CONSTRAINT "ClubCoach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubVolunteer" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clubId" TEXT NOT NULL,

    CONSTRAINT "ClubVolunteer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubReferee" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clubId" TEXT NOT NULL,

    CONSTRAINT "ClubReferee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubStaff" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "ClubPersonRole" NOT NULL DEFAULT 'OTHER',
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clubId" TEXT NOT NULL,

    CONSTRAINT "ClubStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubTeamPlayer" (
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubTeamPlayer_pkey" PRIMARY KEY ("teamId","playerId")
);

-- CreateTable
CREATE TABLE "_StaffToTeam" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StaffToTeam_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Club_ownerUserId_name_key" ON "Club"("ownerUserId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ClubTeam_clubId_name_key" ON "ClubTeam"("clubId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ClubPlayer_clubId_number_key" ON "ClubPlayer"("clubId", "number");

-- CreateIndex
CREATE INDEX "_StaffToTeam_B_index" ON "_StaffToTeam"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Classifier_seasonId_phone_key" ON "Classifier"("seasonId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Coach_seasonId_phone_key" ON "Coach"("seasonId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Referee_seasonId_phone_key" ON "Referee"("seasonId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Season_year_key" ON "Season"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_seasonId_firstName_lastName_key" ON "Staff"("seasonId", "firstName", "lastName");

-- CreateIndex
CREATE UNIQUE INDEX "Team_seasonId_name_key" ON "Team"("seasonId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_seasonId_name_key" ON "Tournament"("seasonId", "name");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTeam" ADD CONSTRAINT "ClubTeam_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTeam" ADD CONSTRAINT "ClubTeam_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "ClubCoach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPlayer" ADD CONSTRAINT "ClubPlayer_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubCoach" ADD CONSTRAINT "ClubCoach_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubVolunteer" ADD CONSTRAINT "ClubVolunteer_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubReferee" ADD CONSTRAINT "ClubReferee_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubStaff" ADD CONSTRAINT "ClubStaff_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTeamPlayer" ADD CONSTRAINT "ClubTeamPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ClubTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTeamPlayer" ADD CONSTRAINT "ClubTeamPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "ClubPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffToTeam" ADD CONSTRAINT "_StaffToTeam_A_fkey" FOREIGN KEY ("A") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffToTeam" ADD CONSTRAINT "_StaffToTeam_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
