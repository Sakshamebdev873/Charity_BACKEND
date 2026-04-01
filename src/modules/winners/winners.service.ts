import { sendPayoutConfirmation } from "../../common/utils/email";
import { prisma } from "../../config/prisma";
import { VerifyWinnerInput, UpdatePayoutInput } from "./winners.schema";

export class WinnersService {
  // Subscriber — my winnings
  static async getByUser(userId: string) {
    const [winners, aggregate] = await Promise.all([
      prisma.winner.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          draw: { select: { id: true, monthYear: true, drawDate: true, winningNumbers: true } },
        },
      }),
      prisma.winner.aggregate({
        where: { userId, verificationStatus: "APPROVED" },
        _sum: { prizeAmountCents: true },
      }),
    ]);

    return {
      winners,
      totalWonCents: aggregate._sum.prizeAmountCents || 0,
    };
  }

  // Upload proof screenshot
  static async uploadProof(winnerId: string, userId: string, proofImageUrl: string) {
    const winner = await prisma.winner.findUnique({ where: { id: winnerId } });
    if (!winner) throw new Error("Winner record not found");
    if (winner.userId !== userId) throw new Error("Unauthorized");
    if (winner.verificationStatus !== "PENDING") throw new Error("Already reviewed");

    return prisma.winner.update({
      where: { id: winnerId },
      data: {
        proofImageUrl,
        verificationStatus: "PENDING", // stays pending until admin reviews
      },
    });
  }

  // Admin — get all winners
  static async getAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { verificationStatus: status as any } : {};

    const [winners, total] = await Promise.all([
      prisma.winner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          draw: { select: { id: true, monthYear: true, winningNumbers: true } },
        },
      }),
      prisma.winner.count({ where }),
    ]);

    return { winners, total, page, totalPages: Math.ceil(total / limit) };
  }

  // Admin — verify winner
  static async verify(winnerId: string, data: VerifyWinnerInput) {
    return prisma.winner.update({
      where: { id: winnerId },
      data: {
        verificationStatus: data.verificationStatus,
        adminNotes: data.adminNotes,
        verifiedAt: new Date(),
      },
    });
  }

  // Admin — update payout
  static async updatePayout(winnerId: string, data: UpdatePayoutInput) {
    const updated = await prisma.winner.update({
      where: { id: winnerId },
      data: {
        payoutStatus: data.payoutStatus,
        paidAt: data.payoutStatus === "PAID" ? new Date() : null,
      },
    });
    if (data.payoutStatus === "PAID") {
      const userData = await prisma.user.findUnique({ where: { id: updated.userId } });
      if (userData) {
        sendPayoutConfirmation(userData.email, userData.firstName, updated.prizeAmountCents).catch(console.error);
      }
    }
    return updated;
  }

  // Admin — get by draw
  static async getByDraw(drawId: string) {
    return prisma.winner.findMany({
      where: { drawId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: [{ matchTier: "asc" }, { prizeAmountCents: "desc" }],
    });
  }
}