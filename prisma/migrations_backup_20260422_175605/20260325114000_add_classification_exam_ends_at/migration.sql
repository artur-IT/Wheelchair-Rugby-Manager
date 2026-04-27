-- Add optional endsAt for classification exams
ALTER TABLE "ClassificationExam" ADD COLUMN "endsAt" TIMESTAMP(3);

