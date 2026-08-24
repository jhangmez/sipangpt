-- AlterTable
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "browser";
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "city";
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "browser_name" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "os_name" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "location" TEXT;
