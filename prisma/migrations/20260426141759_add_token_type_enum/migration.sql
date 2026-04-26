/*
  Warnings:

  - Changed the type of `type` on the `password_reset_tokens` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('PASSWORD_SETUP', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "event_id_templates" ALTER COLUMN "layout_id" SET DEFAULT 'gradient-bottom';

-- AlterTable
ALTER TABLE "password_reset_tokens" DROP COLUMN "type",
ADD COLUMN     "type" "TokenType" NOT NULL;
