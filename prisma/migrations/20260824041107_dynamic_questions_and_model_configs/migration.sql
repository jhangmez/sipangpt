/*
  Warnings:

  - The primary key for the `preguntas` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "preguntas" DROP CONSTRAINT "preguntas_creado_por_id_fkey";

-- AlterTable
ALTER TABLE "ai_model_configs" ADD COLUMN     "description" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "preguntas" DROP CONSTRAINT "preguntas_pkey",
ADD COLUMN     "category" TEXT DEFAULT 'general',
ADD COLUMN     "icon" TEXT NOT NULL DEFAULT '📋',
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "creado_por_id" DROP NOT NULL,
ADD CONSTRAINT "preguntas_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "preguntas_id_seq";

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
