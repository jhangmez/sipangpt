-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('ONLINE', 'DEGRADED', 'OFFLINE', 'DISABLED');

-- AlterTable
ALTER TABLE "ai_model_configs" ADD COLUMN     "latency_ms" INTEGER,
ADD COLUMN     "status" "ModelStatus" NOT NULL DEFAULT 'ONLINE';

-- CreateTable
CREATE TABLE "user_memories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fact" TEXT NOT NULL,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_memories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_memories_user_id_idx" ON "user_memories"("user_id");

-- AddForeignKey
ALTER TABLE "user_memories" ADD CONSTRAINT "user_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
