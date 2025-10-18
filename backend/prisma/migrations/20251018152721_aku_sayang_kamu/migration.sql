/*
  Warnings:

  - You are about to drop the column `dispositionMethod` on the `incoming_letters` table. All the data in the column will be lost.
  - The `dispositionTarget` column on the `incoming_letters` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `dispositionMethod` on the `outgoing_letters` table. All the data in the column will be lost.
  - You are about to drop the `dispositions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ProcessingMethod" AS ENUM ('MANUAL', 'SRIKANDI');

-- CreateEnum
CREATE TYPE "DispositionTarget" AS ENUM ('UMPEG', 'PERENCANAAN', 'KAUR_KEUANGAN', 'KABID', 'BIDANG1', 'BIDANG2', 'BIDANG3', 'BIDANG4', 'BIDANG5');

-- DropForeignKey
ALTER TABLE "dispositions" DROP CONSTRAINT "dispositions_createdById_fkey";

-- DropForeignKey
ALTER TABLE "dispositions" DROP CONSTRAINT "dispositions_incomingLetterId_fkey";

-- AlterTable
ALTER TABLE "incoming_letters" DROP COLUMN "dispositionMethod",
ADD COLUMN     "processingMethod" "ProcessingMethod" NOT NULL DEFAULT 'MANUAL',
DROP COLUMN "dispositionTarget",
ADD COLUMN     "dispositionTarget" "DispositionTarget";

-- AlterTable
ALTER TABLE "outgoing_letters" DROP COLUMN "dispositionMethod",
ADD COLUMN     "processingMethod" "ProcessingMethod" NOT NULL DEFAULT 'MANUAL';

-- DropTable
DROP TABLE "dispositions";

-- DropEnum
DROP TYPE "DispositionMethod";

-- DropEnum
DROP TYPE "DispositionType";

-- CreateIndex
CREATE INDEX "incoming_letters_processingMethod_idx" ON "incoming_letters"("processingMethod");

-- CreateIndex
CREATE INDEX "incoming_letters_dispositionTarget_idx" ON "incoming_letters"("dispositionTarget");
