-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "device_type" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "user_agent" TEXT;
