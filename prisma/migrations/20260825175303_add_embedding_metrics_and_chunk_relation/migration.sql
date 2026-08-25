/*
  Warnings:

  - You are about to drop the column `browser` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "message_citations" ADD COLUMN     "chunk_id" TEXT,
ADD COLUMN     "embedding_model" TEXT DEFAULT 'gemini-embedding-2';

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "embedding_model" TEXT DEFAULT 'gemini-embedding-2',
ADD COLUMN     "generation_latency_ms" INTEGER,
ADD COLUMN     "retrieval_latency_ms" INTEGER;

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "browser",
DROP COLUMN "city";

-- AddForeignKey
ALTER TABLE "message_citations" ADD CONSTRAINT "message_citations_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "document_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
