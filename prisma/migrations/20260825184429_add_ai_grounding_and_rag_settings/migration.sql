-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "enable_image_analysis" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enable_maps_search" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enable_rag" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enable_web_search" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "min_similarity_score" DOUBLE PRECISION NOT NULL DEFAULT 0.50;
