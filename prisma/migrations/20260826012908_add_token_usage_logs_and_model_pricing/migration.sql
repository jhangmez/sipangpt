-- CreateEnum
CREATE TYPE "TokenUsageConcept" AS ENUM ('CHAT_COMPLETION', 'RAG_EMBEDDING', 'DOCUMENT_OCR_TRANSCRIPTION', 'QUERY_ANALYSIS', 'OTHER');

-- AlterTable
ALTER TABLE "ai_model_configs" ADD COLUMN     "estimated_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "input_price_per_million" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "output_price_per_million" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "total_inferences" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_tokens_used" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "token_usage_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "conversation_id" TEXT,
    "message_id" TEXT,
    "model_code" TEXT NOT NULL,
    "provider" "ModelProvider" NOT NULL DEFAULT 'GEMINI',
    "concept" "TokenUsageConcept" NOT NULL DEFAULT 'CHAT_COMPLETION',
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "latency_ms" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "token_usage_logs_concept_idx" ON "token_usage_logs"("concept");

-- CreateIndex
CREATE INDEX "token_usage_logs_model_code_idx" ON "token_usage_logs"("model_code");

-- CreateIndex
CREATE INDEX "token_usage_logs_created_at_idx" ON "token_usage_logs"("created_at");

-- AddForeignKey
ALTER TABLE "token_usage_logs" ADD CONSTRAINT "token_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_usage_logs" ADD CONSTRAINT "token_usage_logs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
