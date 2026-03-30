-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUBSCRIBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'LAPSED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "DrawType" AS ENUM ('RANDOM', 'ALGORITHMIC');

-- CreateEnum
CREATE TYPE "DrawStatus" AS ENUM ('SCHEDULED', 'SIMULATED', 'PUBLISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchTier" AS ENUM ('FIVE_MATCH', 'FOUR_MATCH', 'THREE_MATCH');

-- CreateEnum
CREATE TYPE "WinnerVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'SUBSCRIBER',
    "country" TEXT,
    "timezone" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "priceInCents" INTEGER NOT NULL,
    "charityPercentage" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amountInCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "stripePaymentId" TEXT,
    "prizePoolShare" INTEGER NOT NULL,
    "charityShare" INTEGER NOT NULL,
    "platformShare" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "golf_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "playedOn" TIMESTAMP(3) NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "golf_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draws" (
    "id" TEXT NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "monthYear" TEXT NOT NULL,
    "type" "DrawType" NOT NULL DEFAULT 'RANDOM',
    "status" "DrawStatus" NOT NULL DEFAULT 'SCHEDULED',
    "winningNumbers" INTEGER[],
    "totalPoolCents" INTEGER NOT NULL DEFAULT 0,
    "fiveMatchPool" INTEGER NOT NULL DEFAULT 0,
    "fourMatchPool" INTEGER NOT NULL DEFAULT 0,
    "threeMatchPool" INTEGER NOT NULL DEFAULT 0,
    "rolloverCents" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draw_entries" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scores" INTEGER[],
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draw_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draw_simulations" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "simulatedNumbers" INTEGER[],
    "fiveMatchCount" INTEGER NOT NULL DEFAULT 0,
    "fourMatchCount" INTEGER NOT NULL DEFAULT 0,
    "threeMatchCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "simulatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draw_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "winners" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchTier" "MatchTier" NOT NULL,
    "matchedNumbers" INTEGER[],
    "prizeAmountCents" INTEGER NOT NULL,
    "verificationStatus" "WinnerVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "proofImageUrl" TEXT,
    "adminNotes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "winners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "websiteUrl" TEXT,
    "category" TEXT,
    "country" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charity_events" (
    "id" TEXT NOT NULL,
    "charityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "imageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_charity_selections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "charityId" TEXT NOT NULL,
    "contributionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_charity_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "charityId" TEXT NOT NULL,
    "amountInCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "isIndependent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_stripeCustomerId_idx" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentId_key" ON "payments"("stripePaymentId");

-- CreateIndex
CREATE INDEX "payments_subscriptionId_idx" ON "payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "payments_paidAt_idx" ON "payments"("paidAt");

-- CreateIndex
CREATE INDEX "golf_scores_userId_playedOn_idx" ON "golf_scores"("userId", "playedOn" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "golf_scores_userId_position_key" ON "golf_scores"("userId", "position");

-- CreateIndex
CREATE INDEX "draws_status_idx" ON "draws"("status");

-- CreateIndex
CREATE INDEX "draws_drawDate_idx" ON "draws"("drawDate");

-- CreateIndex
CREATE UNIQUE INDEX "draws_monthYear_key" ON "draws"("monthYear");

-- CreateIndex
CREATE INDEX "draw_entries_drawId_idx" ON "draw_entries"("drawId");

-- CreateIndex
CREATE UNIQUE INDEX "draw_entries_drawId_userId_key" ON "draw_entries"("drawId", "userId");

-- CreateIndex
CREATE INDEX "draw_simulations_drawId_idx" ON "draw_simulations"("drawId");

-- CreateIndex
CREATE INDEX "winners_drawId_idx" ON "winners"("drawId");

-- CreateIndex
CREATE INDEX "winners_userId_idx" ON "winners"("userId");

-- CreateIndex
CREATE INDEX "winners_verificationStatus_idx" ON "winners"("verificationStatus");

-- CreateIndex
CREATE INDEX "winners_payoutStatus_idx" ON "winners"("payoutStatus");

-- CreateIndex
CREATE UNIQUE INDEX "charities_slug_key" ON "charities"("slug");

-- CreateIndex
CREATE INDEX "charities_slug_idx" ON "charities"("slug");

-- CreateIndex
CREATE INDEX "charities_isFeatured_idx" ON "charities"("isFeatured");

-- CreateIndex
CREATE INDEX "charities_isActive_idx" ON "charities"("isActive");

-- CreateIndex
CREATE INDEX "charity_events_charityId_idx" ON "charity_events"("charityId");

-- CreateIndex
CREATE INDEX "charity_events_eventDate_idx" ON "charity_events"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "user_charity_selections_userId_key" ON "user_charity_selections"("userId");

-- CreateIndex
CREATE INDEX "user_charity_selections_charityId_idx" ON "user_charity_selections"("charityId");

-- CreateIndex
CREATE INDEX "donations_userId_idx" ON "donations"("userId");

-- CreateIndex
CREATE INDEX "donations_charityId_idx" ON "donations"("charityId");

-- CreateIndex
CREATE INDEX "donations_createdAt_idx" ON "donations"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "platform_config_key_key" ON "platform_config"("key");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "golf_scores" ADD CONSTRAINT "golf_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_entries" ADD CONSTRAINT "draw_entries_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_entries" ADD CONSTRAINT "draw_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_simulations" ADD CONSTRAINT "draw_simulations_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winners" ADD CONSTRAINT "winners_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winners" ADD CONSTRAINT "winners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charity_events" ADD CONSTRAINT "charity_events_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "charities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_charity_selections" ADD CONSTRAINT "user_charity_selections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_charity_selections" ADD CONSTRAINT "user_charity_selections_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "charities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "charities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
