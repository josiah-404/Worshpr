-- CreateEnum
CREATE TYPE "FinanceEntryType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "FinanceCategory" AS ENUM (
  'REGISTRATION',
  'OFFERTORY',
  'DONATION',
  'OTHER_INCOME',
  'PRIZES',
  'DESIGN_PRINTING',
  'FOOD_BEVERAGE',
  'TRANSPORTATION',
  'VENUE',
  'SUPPLIES',
  'MARKETING',
  'OTHER_EXPENSE'
);

-- CreateTable
CREATE TABLE "org_funds" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "initialBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ledger" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "eventId" TEXT,
    "type" "FinanceEntryType" NOT NULL,
    "category" "FinanceCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "payee" TEXT,
    "requestedBy" TEXT,
    "receiptUrl" TEXT,
    "enteredBy" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_funds_orgId_key" ON "org_funds"("orgId");

-- CreateIndex
CREATE INDEX "finance_ledger_orgId_type_idx" ON "finance_ledger"("orgId", "type");

-- CreateIndex
CREATE INDEX "finance_ledger_orgId_date_idx" ON "finance_ledger"("orgId", "date");

-- CreateIndex
CREATE INDEX "finance_ledger_eventId_idx" ON "finance_ledger"("eventId");

-- AddForeignKey
ALTER TABLE "org_funds" ADD CONSTRAINT "org_funds_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger" ADD CONSTRAINT "finance_ledger_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger" ADD CONSTRAINT "finance_ledger_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger" ADD CONSTRAINT "finance_ledger_enteredBy_fkey" FOREIGN KEY ("enteredBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
