-- AlterTable
ALTER TABLE "registrants" ADD COLUMN     "churchId" TEXT,
ADD COLUMN     "divisionOrgId" TEXT;

-- CreateTable
CREATE TABLE "churches" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "churches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_churches" (
    "eventId" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,

    CONSTRAINT "event_churches_pkey" PRIMARY KEY ("eventId","churchId")
);

-- CreateIndex
CREATE INDEX "churches_orgId_isActive_idx" ON "churches"("orgId", "isActive");

-- AddForeignKey
ALTER TABLE "churches" ADD CONSTRAINT "churches_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_churches" ADD CONSTRAINT "event_churches_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_churches" ADD CONSTRAINT "event_churches_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrants" ADD CONSTRAINT "registrants_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrants" ADD CONSTRAINT "registrants_divisionOrgId_fkey" FOREIGN KEY ("divisionOrgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
