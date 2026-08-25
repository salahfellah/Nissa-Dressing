-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING_REVIEW', 'REJECTED', 'AWAITING_PAYMENT', 'PAYMENT_DONE', 'ONBOARDING', 'MEMBER');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'SOLD');

-- CreateEnum
CREATE TYPE "PackageFormat" AS ENUM ('PETIT', 'MOYEN', 'GRAND');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('NEUF_ETIQUETTE', 'NEUF', 'TRES_BON_ETAT', 'BON_ETAT', 'SATISFAISANT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'SHIPPED', 'RECEIVED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING_REVIEW', 'ACCEPTED', 'REJECTED', 'RETURN_SHIPPED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "StripeConnectStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('DAMAGED', 'NOT_AS_DESCRIBED', 'WRONG_ITEM', 'NOT_RECEIVED', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "status" "MemberStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "isVeiled" BOOLEAN NOT NULL DEFAULT true,
    "audioOathPath" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "recipientName" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'France',
    "phone" TEXT,
    "stripeAccountId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeConnectStatus" "StripeConnectStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "accessFeePaidAt" TIMESTAMP(3),
    "freeBoostUntil" TIMESTAMP(3),
    "acceptedTermsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "condition" "ItemCondition" NOT NULL,
    "brand" TEXT,
    "priceCents" INTEGER NOT NULL,
    "photos" TEXT[],
    "packageFormat" "PackageFormat" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rejectionReason" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderatedById" TEXT,
    "boostedUntil" TIMESTAMP(3),
    "stripeBoostSubscriptionId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "itemPriceCents" INTEGER NOT NULL,
    "shippingCents" INTEGER NOT NULL,
    "commissionCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "sellerPayoutCents" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "shipRecipientName" TEXT NOT NULL,
    "shipLine1" TEXT NOT NULL,
    "shipLine2" TEXT,
    "shipPostalCode" TEXT NOT NULL,
    "shipCity" TEXT NOT NULL,
    "shipCountry" TEXT NOT NULL,
    "shipPhone" TEXT,
    "fromRecipientName" TEXT NOT NULL,
    "fromLine1" TEXT NOT NULL,
    "fromLine2" TEXT,
    "fromPostalCode" TEXT NOT NULL,
    "fromCity" TEXT NOT NULL,
    "fromCountry" TEXT NOT NULL,
    "fromPhone" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "stripeTransferId" TEXT,
    "stripeRefundId" TEXT,
    "paidAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reason" "ReturnReason" NOT NULL,
    "description" TEXT NOT NULL,
    "photos" TEXT[],
    "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "adminNote" TEXT,
    "returnWaybillGeneratedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_pseudo_key" ON "User"("pseudo");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "Listing_status_createdAt_idx" ON "Listing"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_categoryId_status_idx" ON "Listing"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Listing_subcategoryId_status_idx" ON "Listing"("subcategoryId", "status");

-- CreateIndex
CREATE INDEX "Listing_sellerId_status_idx" ON "Listing"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Listing_boostedUntil_idx" ON "Listing"("boostedUntil");

-- CreateIndex
CREATE INDEX "Favorite_listingId_idx" ON "Favorite"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON "Favorite"("userId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Order_listingId_key" ON "Order"("listingId");

-- CreateIndex
CREATE INDEX "Order_buyerId_status_idx" ON "Order"("buyerId", "status");

-- CreateIndex
CREATE INDEX "Order_sellerId_status_idx" ON "Order"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Message_orderId_createdAt_idx" ON "Message"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_orderId_key" ON "ReturnRequest"("orderId");

-- CreateIndex
CREATE INDEX "ReturnRequest_status_idx" ON "ReturnRequest"("status");

-- CreateIndex
CREATE INDEX "ContactRequest_handledAt_idx" ON "ContactRequest"("handledAt");

-- CreateIndex
CREATE INDEX "EmailLog_sentAt_idx" ON "EmailLog"("sentAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
