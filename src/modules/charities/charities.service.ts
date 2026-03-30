import { prisma } from "../../config/prisma";
import { CreateCharityInput, UpdateCharityInput } from "./charities.schema";

export class CharitiesService {
  // Public
  static async getAll(search?: string, category?: string) {
    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = category;

    return prisma.charity.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      include: {
        _count: { select: { userSelections: true, donations: true } },
      },
    });
  }

  static async getBySlug(slug: string) {
    return prisma.charity.findUnique({
      where: { slug },
      include: {
        events: {
          where: { isPublished: true, eventDate: { gte: new Date() } },
          orderBy: { eventDate: "asc" },
        },
        _count: { select: { userSelections: true, donations: true } },
      },
    });
  }

  static async getFeatured() {
    return prisma.charity.findMany({
      where: { isFeatured: true, isActive: true },
      take: 5,
    });
  }

  // Admin
  static async create(data: CreateCharityInput) {
    return prisma.charity.create({ data: { ...data, isActive: true } });
  }

  static async update(id: string, data: UpdateCharityInput) {
    return prisma.charity.update({ where: { id }, data });
  }

  static async delete(id: string) {
    // Soft delete — deactivate
    return prisma.charity.update({
      where: { id },
      data: { isActive: false },
    });
  }

  static async adminGetAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [charities, total] = await Promise.all([
      prisma.charity.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { userSelections: true, donations: true } } },
      }),
      prisma.charity.count(),
    ]);
    return { charities, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async getDonationTotals() {
    const totals = await prisma.donation.groupBy({
      by: ["charityId"],
      _sum: { amountInCents: true },
      _count: true,
    });

    const charities = await prisma.charity.findMany({
      where: { id: { in: totals.map((t:any) => t.charityId) } },
      select: { id: true, name: true, slug: true },
    });

    return totals.map((t:any) => ({
      charity: charities.find((c:any) => c.id === t.charityId),
      totalDonatedCents: t._sum.amountInCents || 0,
      donationCount: t._count,
    }));
  }
}