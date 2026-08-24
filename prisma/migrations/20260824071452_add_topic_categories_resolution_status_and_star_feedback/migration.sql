/*
  Warnings:

  - You are about to drop the column `url` on the `feedbacks` table. All the data in the column will be lost.
  - Made the column `rating` on table `feedbacks` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ResolutionStatus" AS ENUM ('RESOLVED_WITH_SOURCES', 'RESOLVED_GENERAL', 'NO_CONTEXT_FOUND', 'UNRESOLVED_BY_FALLBACK', 'ERROR_OCCURRED');

-- AlterEnum
ALTER TYPE "ModelProvider" ADD VALUE 'GROQ';

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "category_id" TEXT;

-- AlterTable
ALTER TABLE "feedbacks" DROP COLUMN "url",
ADD COLUMN     "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "rating" SET NOT NULL;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "detected_intent" TEXT,
ADD COLUMN     "resolution_status" "ResolutionStatus" NOT NULL DEFAULT 'RESOLVED_WITH_SOURCES',
ADD COLUMN     "subcategory_id" TEXT;

-- CreateTable
CREATE TABLE "topic_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_subcategories" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topic_categories_name_key" ON "topic_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "topic_categories_code_key" ON "topic_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "topic_subcategories_category_id_code_key" ON "topic_subcategories"("category_id", "code");

-- AddForeignKey
ALTER TABLE "topic_subcategories" ADD CONSTRAINT "topic_subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "topic_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "topic_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "topic_subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "topic_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
