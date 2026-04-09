-- Make registrant email unique (required for upsert deduplication)
-- Drop the existing non-unique index first, then add a unique constraint
DROP INDEX IF EXISTS "registrants_email_idx";

ALTER TABLE "registrants" ADD CONSTRAINT "registrants_email_key" UNIQUE ("email");
