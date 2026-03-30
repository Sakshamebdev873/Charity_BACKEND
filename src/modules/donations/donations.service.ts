import { prisma } from "../../config/prisma";
import { CreateDonationInput } from "./donations.schema";

export class DonationsService {
  static async create(userId: string, data: CreateDonationInput) {
    const charity = await prisma.charity.findUnique({ where: { id: data.charityId } });
    if (!charity || !charity.isActive) throw new Error("Charity not found or inactive");

    return prisma.donation.create({
      data: {
        userId,
        charityId: data.charityId,
        amountInCents: data.amountInCents,
        currency: data.currency,
        isIndependent: true,
      },
      include: {
        charity: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  static async getByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          charity: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.donation.count({ where: { userId } }),
    ]);

    const totalDonated = await prisma.donation.aggregate({
      where: { userId },
      _sum: { amountInCents: true },
    });

    return {
      donations,
      totalDonatedCents: totalDonated._sum.amountInCents || 0,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Admin
  static async getAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [donations, total, aggregate] = await Promise.all([
      prisma.donation.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          charity: { select: { id: true, name: true } },
        },
      }),
      prisma.donation.count(),
      prisma.donation.aggregate({ _sum: { amountInCents: true } }),
    ]);

    return {
      donations,
      totalDonatedCents: aggregate._sum.amountInCents || 0,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}