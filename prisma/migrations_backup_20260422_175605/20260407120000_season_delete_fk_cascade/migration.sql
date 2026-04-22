-- Allow CASCADE deletes when removing Season-related rows in any order
-- (RESTRICT on these FKs caused 500 on DELETE /api/seasons/:id).

ALTER TABLE "Match" DROP CONSTRAINT "Match_teamAId_fkey";
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Match" DROP CONSTRAINT "Match_teamBId_fkey";
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RefereeAssignment" DROP CONSTRAINT "RefereeAssignment_refereeId_fkey";
ALTER TABLE "RefereeAssignment" ADD CONSTRAINT "RefereeAssignment_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "Referee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassificationExam" DROP CONSTRAINT "ClassificationExam_classifierId_fkey";
ALTER TABLE "ClassificationExam" ADD CONSTRAINT "ClassificationExam_classifierId_fkey" FOREIGN KEY ("classifierId") REFERENCES "Classifier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassificationExam" DROP CONSTRAINT "ClassificationExam_playerId_fkey";
ALTER TABLE "ClassificationExam" ADD CONSTRAINT "ClassificationExam_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
