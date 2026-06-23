-- CreateTable
CREATE TABLE "user_organizations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("id")
);

-- Add is_super_admin column before migrating data
ALTER TABLE "users" ADD COLUMN "is_super_admin" BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing org memberships (non-super-admin users with an org)
INSERT INTO "user_organizations" ("id", "user_id", "org_id", "role", "title", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    "id",
    "orgId",
    "role",
    "title",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users"
WHERE "orgId" IS NOT NULL AND "role" != 'super_admin';

-- Mark super admins
UPDATE "users" SET "is_super_admin" = true WHERE "role" = 'super_admin';

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_orgId_fkey";

-- Drop old tenant columns from users
ALTER TABLE "users" DROP COLUMN "orgId",
DROP COLUMN "role",
DROP COLUMN "title";

-- CreateIndex
CREATE UNIQUE INDEX "user_organizations_user_id_org_id_key" ON "user_organizations"("user_id", "org_id");

-- CreateIndex
CREATE INDEX "user_organizations_org_id_role_idx" ON "user_organizations"("org_id", "role");

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
