-- AlterTable
ALTER TABLE "event_questions" ADD COLUMN     "parentQuestionId" TEXT,
ADD COLUMN     "triggerOption" TEXT;

-- CreateIndex
CREATE INDEX "event_questions_parentQuestionId_idx" ON "event_questions"("parentQuestionId");

-- AddForeignKey
ALTER TABLE "event_questions" ADD CONSTRAINT "event_questions_parentQuestionId_fkey" FOREIGN KEY ("parentQuestionId") REFERENCES "event_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
