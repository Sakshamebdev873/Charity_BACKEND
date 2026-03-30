import { prisma } from "../../config/prisma";

export class PaymentsService {
  static async getByUser(userId: string, page = 1, limit = 20) {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return { payments: [], total: 0, page, totalPages: 0 };

    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { subscriptionId: sub.id },
        skip,
        take: limit,
        orderBy: { paidAt: "desc" },
      }),
      prisma.payment.count({ where: { subscriptionId: sub.id } }),
    ]);

    return { payments, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async getAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { paidAt: "desc" },
        include: {
          subscription: {
            include: {
              user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.payment.count(),
    ]);

    return { payments, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async getTotalPrizePool() {
    const result = await prisma.payment.aggregate({
      _sum: { prizePoolShare: true },
    });
    return result._sum.prizePoolShare || 0;
  }
}