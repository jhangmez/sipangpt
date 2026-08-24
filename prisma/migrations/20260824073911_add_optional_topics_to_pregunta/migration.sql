-- AlterTable
ALTER TABLE "preguntas" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "subcategory_id" TEXT;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "topic_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "topic_subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
