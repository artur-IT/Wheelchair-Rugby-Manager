-- Add observation flag to classification exams (yes/no in plan UI)
ALTER TABLE "ClassificationExam"
ADD COLUMN "observation" BOOLEAN NOT NULL DEFAULT false;

