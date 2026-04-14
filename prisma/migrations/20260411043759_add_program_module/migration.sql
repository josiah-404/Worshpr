-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'PENDING', 'FINAL');

-- CreateEnum
CREATE TYPE "ProgramItemType" AS ENUM ('SESSION_HEADER', 'ITEM');

-- CreateEnum
CREATE TYPE "ProgramSession" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateTable
CREATE TABLE "event_programs" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "totalDays" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_items" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "day" INTEGER NOT NULL DEFAULT 1,
    "type" "ProgramItemType" NOT NULL DEFAULT 'ITEM',
    "session" "ProgramSession",
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "time" TEXT,
    "churchId" TEXT,
    "presenterName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_programs_eventId_key" ON "event_programs"("eventId");

-- CreateIndex
CREATE INDEX "program_items_programId_day_order_idx" ON "program_items"("programId", "day", "order");

-- AddForeignKey
ALTER TABLE "event_programs" ADD CONSTRAINT "event_programs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_items" ADD CONSTRAINT "program_items_programId_fkey" FOREIGN KEY ("programId") REFERENCES "event_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_items" ADD CONSTRAINT "program_items_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
