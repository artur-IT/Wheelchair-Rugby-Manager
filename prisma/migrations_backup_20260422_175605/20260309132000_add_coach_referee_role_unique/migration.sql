-- AlterEnum: rename COURT_1/COURT_2 to REFEREE_1/REFEREE_2
ALTER TYPE "RefereeRole" RENAME VALUE 'COURT_1' TO 'REFEREE_1';
ALTER TYPE "RefereeRole" RENAME VALUE 'COURT_2' TO 'REFEREE_2';

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seasonId" TEXT NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- AlterTable: drop coachName, add coachId FK
ALTER TABLE "Team" DROP COLUMN "coachName";
ALTER TABLE "Team" ADD COLUMN "coachId" TEXT;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "RefereeAssignment_matchId_role_key" ON "RefereeAssignment"("matchId", "role");
