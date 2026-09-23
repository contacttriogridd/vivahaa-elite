-- AlterTable: physical/background fields collected by the new 5-step registration wizard
ALTER TABLE "User" ADD COLUMN     "complexion" TEXT,
ADD COLUMN     "disabilityStatus" TEXT;

-- CreateIndex: admin panel filters (Reports, Engagement, Users) by these together
CREATE INDEX "User_religion_caste_city_idx" ON "User"("religion", "caste", "city");
CREATE INDEX "User_plan_idx" ON "User"("plan");

-- CreateTable: pre-signup registration state, keyed by an opaque draftToken. See
-- prisma/schema.prisma's doc comment on this model for why it exists.
CREATE TABLE "RegistrationDraft" (
    "id" TEXT NOT NULL,
    "draftToken" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "email" TEXT,
    "selectedPlan" "PlanTier",
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationDraft_draftToken_key" ON "RegistrationDraft"("draftToken");

-- AlterTable: a Payment can now exist before any User (Razorpay order created against a
-- draft) — see the webhook in server/routes/payments.js, the only place a self-registered
-- User gets created.
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";
ALTER TABLE "Payment" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "method" DROP NOT NULL;
ALTER TABLE "Payment" ADD COLUMN     "draftId" TEXT,
ADD COLUMN     "payerName" TEXT,
ADD COLUMN     "payerEmail" TEXT,
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpaySignature" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "RegistrationDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
