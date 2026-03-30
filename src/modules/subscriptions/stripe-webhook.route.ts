import { Router, Request, Response } from "express";
import express from "express";
import Stripe from "stripe";
import { stripe } from "../../config/stripe";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";

const router = Router();

// IMPORTANT: Stripe webhooks need raw body, not parsed JSON
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
      return;
    }

    try {
      switch (event.type) {
        // ── Subscription Created ──
        case "customer.subscription.created": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          const existing = await prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });

          if (existing) {
            await prisma.subscription.update({
              where: { id: existing.id },
              data: {
                stripeSubscriptionId: subscription.id,
                status: "ACTIVE",
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              },
            });
          }

          console.log("✅ Subscription created:", subscription.id);
          break;
        }

        // ── Subscription Updated ──
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          const statusMap: Record<string, string> = {
            active: "ACTIVE",
            canceled: "CANCELLED",
            past_due: "PAST_DUE",
            unpaid: "LAPSED",
          };

          await prisma.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              status: (statusMap[subscription.status] || "ACTIVE") as any,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelledAt: subscription.canceled_at
                ? new Date(subscription.canceled_at * 1000)
                : null,
            },
          });

          console.log("✅ Subscription updated:", subscription.id, "→", subscription.status);
          break;
        }

        // ── Subscription Deleted (cancelled) ──
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          await prisma.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              status: "CANCELLED",
              cancelledAt: new Date(),
            },
          });

          console.log("✅ Subscription cancelled:", subscription.id);
          break;
        }

        // ── Payment Succeeded ──
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;

          const sub = await prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
            include: { user: { include: { charitySelection: true } } },
          });

          if (sub) {
            const amountCents = invoice.amount_paid;
            const charityPercent = sub.charityPercentage || 10;
            const charityShare = Math.floor(amountCents * (charityPercent / 100));
            const remaining = amountCents - charityShare;
            const prizePoolShare = Math.floor(remaining * 0.5);
            const platformShare = remaining - prizePoolShare;

            await prisma.payment.create({
              data: {
                subscriptionId: sub.id,
                amountInCents: amountCents,
                stripePaymentId: invoice.payment_intent as string,
                prizePoolShare,
                charityShare,
                platformShare,
              },
            });

            // Record charity donation
            if (sub.user.charitySelection) {
              await prisma.donation.create({
                data: {
                  userId: sub.userId,
                  charityId: sub.user.charitySelection.charityId,
                  amountInCents: charityShare,
                  isIndependent: false,
                },
              });
            }

            // Update subscription period
            await prisma.subscription.update({
              where: { id: sub.id },
              data: {
                status: "ACTIVE",
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(
                  sub.plan === "YEARLY"
                    ? Date.now() + 365 * 24 * 60 * 60 * 1000
                    : Date.now() + 30 * 24 * 60 * 60 * 1000
                ),
              },
            });

            console.log("✅ Payment recorded:", amountCents, "cents");
          }
          break;
        }

        // ── Payment Failed ──
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;

          await prisma.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: { status: "PAST_DUE" },
          });

          // Notify user
          const sub = await prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });

          if (sub) {
            await prisma.notification.create({
              data: {
                userId: sub.userId,
                title: "Payment Failed",
                body: "Your subscription payment failed. Please update your payment method.",
                type: "SUBSCRIPTION_UPDATE",
              },
            });
          }

          console.log("⚠️ Payment failed for customer:", customerId);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("❌ Webhook handler error:", error);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);

export default router;