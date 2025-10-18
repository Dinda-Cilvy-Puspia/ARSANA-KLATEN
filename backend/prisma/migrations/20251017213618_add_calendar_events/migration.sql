-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MEETING', 'APPOINTMENT', 'DEADLINE', 'OTHER');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "calendarEventId" TEXT;

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "location" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'MEETING',
    "notified3Days" BOOLEAN NOT NULL DEFAULT false,
    "notified1Day" BOOLEAN NOT NULL DEFAULT false,
    "incomingLetterId" TEXT,
    "outgoingLetterId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_events_date_idx" ON "calendar_events"("date");

-- CreateIndex
CREATE INDEX "calendar_events_incomingLetterId_idx" ON "calendar_events"("incomingLetterId");

-- CreateIndex
CREATE INDEX "calendar_events_outgoingLetterId_idx" ON "calendar_events"("outgoingLetterId");

-- CreateIndex
CREATE INDEX "calendar_events_userId_idx" ON "calendar_events"("userId");

-- CreateIndex
CREATE INDEX "notifications_calendarEventId_idx" ON "notifications"("calendarEventId");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_incomingLetterId_fkey" FOREIGN KEY ("incomingLetterId") REFERENCES "incoming_letters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_outgoingLetterId_fkey" FOREIGN KEY ("outgoingLetterId") REFERENCES "outgoing_letters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "calendar_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
