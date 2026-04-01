import { prisma } from "../../config/prisma";

export class AdminService {
  static async getDashboard() {
    const [
      totalUsers,
      activeSubscribers,
      totalPrizePool,
      totalCharityDonations,
      totalDraws,
      pendingVerifications,
      pendingPayouts,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "SUBSCRIBER" } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.payment.aggregate({ _sum: { prizePoolShare: true } }),
      prisma.donation.aggregate({ _sum: { amountInCents: true } }),
      prisma.draw.count(),
      prisma.winner.count({ where: { verificationStatus: "PENDING" } }),
      prisma.winner.count({ where: { payoutStatus: "PENDING", verificationStatus: "APPROVED" } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
      }),
    ]);

    // Subscription breakdown
    const subscriptionBreakdown = await prisma.subscription.groupBy({
      by: ["plan", "status"],
      _count: true,
    });

    // Draw statistics
    const drawStats = await prisma.draw.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { drawDate: "desc" },
      take: 6,
      select: {
        id: true,
        monthYear: true,
        totalPoolCents: true,
        _count: { select: { entries: true, winners: true } },
      },
    });

    return {
      overview: {
        totalUsers,
        activeSubscribers,
        totalPrizePoolCents: totalPrizePool._sum.prizePoolShare || 0,
        totalCharityDonationsCents: totalCharityDonations._sum.amountInCents || 0,
        totalDraws,
        pendingVerifications,
        pendingPayouts,
      },
      subscriptionBreakdown,
      recentDraws: drawStats,
      recentUsers,
    };
  }

  static async getReports() {
    // Use aggregate instead of groupBy with empty by
    const totalPayments = await prisma.payment.aggregate({
      _sum: {
        amountInCents: true,
        prizePoolShare: true,
        charityShare: true,
        platformShare: true,
      },
      _count: true,
    });

    // Top charities by donations
    const topCharities = await prisma.donation.groupBy({
      by: ["charityId"],
      _sum: { amountInCents: true },
      _count: true,
      orderBy: { _sum: { amountInCents: "desc" } },
      take: 10,
    });

    const charityDetails = await prisma.charity.findMany({
      where: { id: { in: topCharities.map((c) => c.charityId) } },
      select: { id: true, name: true, slug: true },
    });

    // Winner stats
    const winnerStats = await prisma.winner.groupBy({
      by: ["matchTier"],
      _count: true,
      _sum: { prizeAmountCents: true },
    });

    return {
      revenue: {
        _sum: totalPayments._sum,
        _count: totalPayments._count,
      },
      topCharities: topCharities.map((tc) => ({
        charity: charityDetails.find((c) => c.id === tc.charityId),
        totalCents: tc._sum.amountInCents || 0,
        count: tc._count,
      })),
      winnerStats,
    };
  }
}