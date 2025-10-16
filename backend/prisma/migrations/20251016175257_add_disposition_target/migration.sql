/*
  Warnings:

  - Added the required column `dispositionTarget` to the `incoming_letters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "incoming_letters" ADD COLUMN     "dispositionTarget" TEXT NOT NULL,
ADD COLUMN     "overdueNotifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "outgoing_letters" ADD COLUMN     "overdueNotifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "dispositions_incomingLetterId_idx" ON "dispositions"("incomingLetterId");

-- CreateIndex
CREATE INDEX "dispositions_createdById_idx" ON "dispositions"("createdById");

-- CreateIndex
CREATE INDEX "incoming_letters_userId_idx" ON "incoming_letters"("userId");

-- CreateIndex
CREATE INDEX "incoming_letters_receivedDate_idx" ON "incoming_letters"("receivedDate");

-- CreateIndex
CREATE INDEX "incoming_letters_letterNature_idx" ON "incoming_letters"("letterNature");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "outgoing_letters_userId_idx" ON "outgoing_letters"("userId");

-- CreateIndex
CREATE INDEX "outgoing_letters_createdDate_idx" ON "outgoing_letters"("createdDate");
