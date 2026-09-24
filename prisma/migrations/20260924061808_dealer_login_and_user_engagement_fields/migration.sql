-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "Dealer" ADD COLUMN     "password" TEXT;

-- CreateTable
CREATE TABLE "ProfilePass" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfilePass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileEditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileEditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePass_fromUserId_toUserId_key" ON "ProfilePass"("fromUserId", "toUserId");

-- CreateIndex
CREATE INDEX "ProfileEditLog_userId_createdAt_idx" ON "ProfileEditLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProfilePass" ADD CONSTRAINT "ProfilePass_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilePass" ADD CONSTRAINT "ProfilePass_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileEditLog" ADD CONSTRAINT "ProfileEditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
