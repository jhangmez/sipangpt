-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "is_regeneration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regenerated_from_id" TEXT;
