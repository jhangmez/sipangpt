-- CreateIndex
CREATE INDEX "document_chunks_document_id_idx" ON "document_chunks"("document_id");

-- CreateIndex
CREATE INDEX "document_chunks_page_number_idx" ON "document_chunks"("page_number");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");
