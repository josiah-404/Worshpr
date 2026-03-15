-- CreateEnum (safe, no-op if already exists)
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEDIA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: drop stale title column
ALTER TABLE "users"
    DROP COLUMN IF EXISTS "title";

-- Normalise any non-standard role values to valid enum members
UPDATE "users" SET "role" = 'ADMIN' WHERE "role" NOT IN ('ADMIN', 'MEDIA');

-- Convert role TEXT → UserRole enum
ALTER TABLE "users"
    ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "users"
    ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";

ALTER TABLE "users"
    ALTER COLUMN "role" SET DEFAULT 'MEDIA'::"UserRole";
