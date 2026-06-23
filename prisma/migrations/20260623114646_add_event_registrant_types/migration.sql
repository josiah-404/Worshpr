-- AlterTable
ALTER TABLE "registrations" ADD COLUMN     "registrantTypeId" TEXT,
ADD COLUMN     "registrantTypeLabel" TEXT;

-- CreateTable
CREATE TABLE "event_registrant_types" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registrant_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_registrant_types_eventId_idx" ON "event_registrant_types"("eventId");

-- AddForeignKey
ALTER TABLE "event_registrant_types" ADD CONSTRAINT "event_registrant_types_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_registrantTypeId_fkey" FOREIGN KEY ("registrantTypeId") REFERENCES "event_registrant_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

