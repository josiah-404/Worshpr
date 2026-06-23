-- CreateTable
CREATE TABLE "event_fee_items" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_fee_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_fee_items" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "feeItemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_fee_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_fee_items_eventId_idx" ON "event_fee_items"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "registration_fee_items_registrationId_feeItemId_key" ON "registration_fee_items"("registrationId", "feeItemId");

-- AddForeignKey
ALTER TABLE "event_fee_items" ADD CONSTRAINT "event_fee_items_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_fee_items" ADD CONSTRAINT "registration_fee_items_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_fee_items" ADD CONSTRAINT "registration_fee_items_feeItemId_fkey" FOREIGN KEY ("feeItemId") REFERENCES "event_fee_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
