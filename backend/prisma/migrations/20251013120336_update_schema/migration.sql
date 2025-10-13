-- CreateEnum
CREATE TYPE "DispositionMethod" AS ENUM ('MANUAL', 'SRIKANDI');

-- AlterTable
ALTER TABLE "dispositions" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "incoming_letters" ADD COLUMN     "dispositionMethod" "DispositionMethod",
ADD COLUMN     "followUpDeadline" TIMESTAMP(3),
ADD COLUMN     "needsFollowUp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "srikandiDispositionNumber" TEXT;

-- AlterTable
ALTER TABLE "outgoing_letters" ADD COLUMN     "dispositionMethod" "DispositionMethod",
ADD COLUMN     "srikandiDispositionNumber" TEXT;

-- AddForeignKey
ALTER TABLE "dispositions" ADD CONSTRAINT "dispositions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
