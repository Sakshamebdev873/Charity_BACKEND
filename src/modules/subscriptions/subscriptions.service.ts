import { prisma } from "../../config/prisma";
import { CreateSubscriptionInput, UpdateSubscriptionInput } from "./subscriptions.schema";
import { calculatePaymentSplit } from "../../common/utils/prize-calculator";
import { sendSubscriptionConfirmation } from "../../common/utils/email";

const PRICES = {
  MONTHLY: 999,   // £9.99
  YEARLY: 9990,   // £99.90
};

export class SubscriptionsService {
  static async create(userId: string, data: CreateSubscriptionInput) {
    const existing = await prisma.subscription.findUnique({ where: { userId } });
    if (existing && existing.status === "ACTIVE") {
      throw new Error("You already have an active subscription");
    }

    const priceInCents = PRICES[data.plan];
    const periodEnd = new Date();
    if (data.plan === "MONTHLY") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const result = await prisma.$transaction(async (tx:any) => {
      // Create or update subscription
      const subscription = existing
        ? await tx.subscription.update({
            where: { userId },
            data: {
              plan: data.plan,
              status: "ACTIVE",
              priceInCents,
              charityPercentage: data.charityPercentage,
              currentPeriodStart: new Date(),
              currentPeriodEnd: periodEnd,
              cancelledAt: null,
            },
          })
        : await tx.subscription.create({
            data: {
              userId,
              plan: data.plan,
              status: "ACTIVE",
              priceInCents,
              charityPercentage: data.charityPercentage,
              currentPeriodStart: new Date(),
              currentPeriodEnd: periodEnd,
            },
          });

      // Set charity selection
      await tx.userCharitySelection.upsert({
        where: { userId },
        create: {
          userId,
          charityId: data.charityId,
          contributionPercent: data.charityPercentage,
        },
        update: {
          charityId: data.charityId,
          contributionPercent: data.charityPercentage,
        },
      });

      // Record payment with split
      const split = calculatePaymentSplit(priceInCents, data.charityPercentage);
      await tx.payment.create({
        data: {
          subscriptionId: subscription.id,
          amountInCents: priceInCents,
          prizePoolShare: split.prizePoolShare,
          charityShare: split.charityShare,
          platformShare: split.platformShare,
        },
      });

      // Record donation
      await tx.donation.create({
        data: {
          userId,
          charityId: data.charityId,
          amountInCents: split.charityShare,
          isIndependent: false,
        },
      });

      return subscription;
    });
const charityData = await prisma.charity.findUnique({ where: { id: data.charityId } });
    const userData = await prisma.user.findUnique({ where: { id: userId } });
    if (userData && charityData) {
      sendSubscriptionConfirmation(
        userData.email,
        userData.firstName,
        data.plan,
        charityData.name,
        data.charityPercentage
      ).catch(console.error);
    }
    return result;
  }

  static async getByUserId(userId: string) {
    return prisma.subscription.findUnique({
      where: { userId },
      include: {
        payments: {
          orderBy: { paidAt: "desc" },
          take: 10,
        },
      },
    });
  }

  static async cancel(userId: string) {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new Error("No subscription found");
    if (sub.status !== "ACTIVE") throw new Error("Subscription is not active");

    return prisma.subscription.update({
      where: { userId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });
  }

  static async update(userId: string, data: UpdateSubscriptionInput) {
    return prisma.subscription.update({
      where: { userId },
      data: { charityPercentage: data.charityPercentage },
    });
  }

  // Admin
  static async getAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [subs, total] = await Promise.all([
      prisma.subscription.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.subscription.count(),
    ]);
    return { subscriptions: subs, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async adminUpdate(userId: string, data: { status?: string; plan?: string }) {
    return prisma.subscription.update({
      where: { userId },
      data: data as any,
    });
  }
}