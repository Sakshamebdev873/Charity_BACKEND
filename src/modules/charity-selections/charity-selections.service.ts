import { prisma } from "../../config/prisma";
import { SelectCharityInput } from "./charity-selections.schema";

export class CharitySelectionsService {
  static async select(userId: string, data: SelectCharityInput) {
    const charity = await prisma.charity.findUnique({ where: { id: data.charityId } });
    if (!charity || !charity.isActive) throw new Error("Charity not found or inactive");

    const selection = await prisma.userCharitySelection.upsert({
      where: { userId },
      create: {
        userId,
        charityId: data.charityId,
        contributionPercent: data.contributionPercent,
      },
      update: {
        charityId: data.charityId,
        contributionPercent: data.contributionPercent,
      },
      include: {
        charity: { select: { id: true, name: true, slug: true } },
      },
    });

    // Sync charity percentage to subscription
    await prisma.subscription.updateMany({
      where: { userId },
      data: { charityPercentage: data.contributionPercent },
    });

    return selection;
  }

  static async getMine(userId: string) {
    return prisma.userCharitySelection.findUnique({
      where: { userId },
      include: {
        charity: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
    });
  }
}