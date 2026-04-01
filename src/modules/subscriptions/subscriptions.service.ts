import { prisma } from "../../config/prisma";
import { stripe } from "../../config/stripe";
import { CreateSubscriptionInput, UpdateSubscriptionInput } from "./subscriptions.schema";
import { calculatePaymentSplit } from "../../common/utils/prize-calculator";
import { sendSubscriptionConfirmation, sendSubscriptionCancelled } from "../../common/utils/email";

const PRICES = {
  MONTHLY: parseInt(process.env.MONTHLY_PRICE_PAISA || "19900"),   // ₹199
  YEARLY: parseInt(process.env.YEARLY_PRICE_PAISA || "199900"),     // ₹1999
};

export class SubscriptionsService {
  // Create Stripe Checkout Session — returns URL to redirect user
  static async createCheckoutSession(userId: string, data: CreateSubscriptionInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const existing = await prisma.subscription.findUnique({ where: { userId } });
    
    // Allow if upgrading: only block if they have an active subscription for the EXACT SAME plan
    if (existing && existing.status === "ACTIVE" && existing.plan === data.plan) {
      throw new Error(`You already have an active ${data.plan} subscription`);
    }

    const priceInPaisa = PRICES[data.plan];
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    // Create or get Stripe customer
    let stripeCustomerId = existing?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      mode: "subscription",
      currency: "inr",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `GolfCharity ${data.plan} Plan`,
              description: data.plan === "MONTHLY"
                ? "Monthly subscription — ₹199/month"
                : "Yearly subscription — ₹1,999/year (save ₹389!)",
            },
            unit_amount: priceInPaisa,
            recurring: {
              interval: data.plan === "MONTHLY" ? "month" : "year",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        plan: data.plan,
        charityId: data.charityId,
        charityPercentage: String(data.charityPercentage),
        // Pass the old subscription ID so we can cancel it in the webhook
        oldStripeSubId: existing?.stripeSubscriptionId || "", 
      },
      success_url: `${clientUrl}/dashboard/subscribe?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/dashboard/subscribe?cancelled=true`,
    });

    return { url: session.url, sessionId: session.id };
  }

  // Called by webhook after successful payment
  static async activateFromCheckout(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as "MONTHLY" | "YEARLY";
    const charityId = session.metadata?.charityId;
    const charityPercentage = parseFloat(session.metadata?.charityPercentage || "10");
    const oldStripeSubId = session.metadata?.oldStripeSubId;

    if (!userId || !plan || !charityId) throw new Error("Missing metadata");

    const priceInPaisa = PRICES[plan];
    const stripeSubscription = session.subscription as any;

    // "Cancel & Replace" logic: Cancel the old Stripe subscription so they aren't double billed
    if (oldStripeSubId && oldStripeSubId !== stripeSubscription?.id) {
      try {
        await stripe.subscriptions.cancel(oldStripeSubId);
        console.log(`Cancelled previous Stripe subscription: ${oldStripeSubId}`);
      } catch (error) {
        console.error("Failed to cancel old Stripe subscription during upgrade:", error);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Upsert subscription
      const subscription = await tx.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          status: "ACTIVE",
          priceInCents: priceInPaisa,
          charityPercentage,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: stripeSubscription?.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            plan === "YEARLY"
              ? Date.now() + 365 * 24 * 60 * 60 * 1000
              : Date.now() + 30 * 24 * 60 * 60 * 1000
          ),
        },
        update: {
          plan,
          status: "ACTIVE",
          priceInCents: priceInPaisa,
          charityPercentage,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: stripeSubscription?.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            plan === "YEARLY"
              ? Date.now() + 365 * 24 * 60 * 60 * 1000
              : Date.now() + 30 * 24 * 60 * 60 * 1000
          ),
          cancelledAt: null,
        },
      });

      // Set charity selection
      await tx.userCharitySelection.upsert({
        where: { userId },
        create: { userId, charityId, contributionPercent: charityPercentage },
        update: { charityId, contributionPercent: charityPercentage },
      });

      // Record payment with split
      const split = calculatePaymentSplit(priceInPaisa, charityPercentage);
      await tx.payment.create({
        data: {
          subscriptionId: subscription.id,
          amountInCents: priceInPaisa,
          currency: "INR",
          prizePoolShare: split.prizePoolShare,
          charityShare: split.charityShare,
          platformShare: split.platformShare,
        },
      });

      // Record donation
      await tx.donation.create({
        data: {
          userId,
          charityId,
          amountInCents: split.charityShare,
          currency: "INR",
          isIndependent: false,
        },
      });

      return subscription;
    });

    // Send confirmation email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const charity = await prisma.charity.findUnique({ where: { id: charityId } });
    if (user && charity) {
      sendSubscriptionConfirmation(user.email, user.firstName, plan, charity.name, charityPercentage).catch(console.error);
    }

    return result;
  }

  static async getByUserId(userId: string) {
    return prisma.subscription.findUnique({
      where: { userId },
      include: { payments: { orderBy: { paidAt: "desc" }, take: 10 } },
    });
  }

  static async cancel(userId: string) {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new Error("No subscription found");
    if (sub.status !== "ACTIVE") throw new Error("Subscription is not active");

    // Cancel on Stripe if exists
    if (sub.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId).catch(console.error);
    }

    const updated = await prisma.subscription.update({
      where: { userId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      sendSubscriptionCancelled(user.email, user.firstName, updated.currentPeriodEnd.toLocaleDateString("en-IN")).catch(console.error);
    }

    return updated;
  }

  static async update(userId: string, data: UpdateSubscriptionInput) {
    return prisma.subscription.update({
      where: { userId },
      data: { charityPercentage: data.charityPercentage },
    });
  }

  static async getAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [subs, total] = await Promise.all([
      prisma.subscription.findMany({
        skip, take: limit, orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      prisma.subscription.count(),
    ]);
    return { subscriptions: subs, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async adminUpdate(userId: string, data: { status?: string; plan?: string }) {
    return prisma.subscription.update({ where: { userId }, data: data as any });
  }
}