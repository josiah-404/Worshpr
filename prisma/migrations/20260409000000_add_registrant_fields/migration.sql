-- AlterTable: add nickname, church, organization to registrants
ALTER TABLE "registrants" ADD COLUMN "nickname" TEXT;
ALTER TABLE "registrants" ADD COLUMN "church" TEXT;
ALTER TABLE "registrants" ADD COLUMN "organization" TEXT;
