-- Allow multiple scheduled exams for the same player with the same classifier (e.g. Saturday and Sunday).
DROP INDEX IF EXISTS "ClassificationExam_tournamentId_classifierId_playerId_key";
