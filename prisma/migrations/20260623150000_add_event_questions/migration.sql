-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT', 'CHOICE');

-- CreateTable
CREATE TABLE "event_questions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'TEXT',
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_answers" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "questionId" TEXT,
    "questionLabel" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_questions_eventId_idx" ON "event_questions"("eventId");

-- CreateIndex
CREATE INDEX "registration_answers_registrationId_idx" ON "registration_answers"("registrationId");

-- AddForeignKey
ALTER TABLE "event_questions" ADD CONSTRAINT "event_questions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "event_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
