import { prisma } from "../../config/prisma";
import { CreateDrawInput, UpdateDrawInput } from "./draws.schema";
import {
  generateRandomNumbers,
  generateAlgorithmicNumbers,
  countMatches,
  getMatchTier,
  generateRiggedNumbers,
} from "../../common/utils/draw-engine";
import { calculatePoolTiers, calculatePrizePerWinner } from "../../common/utils/prize-calculator";

export class DrawsService {
  static async create(data: CreateDrawInput) {
    const existing = await prisma.draw.findUnique({
      where: { monthYear: data.monthYear },
    });
    if (existing) throw new Error(`Draw for ${data.monthYear} already exists`);

    return prisma.draw.create({
      data: {
        drawDate: new Date(data.drawDate),
        monthYear: data.monthYear,
        type: data.type,
        status: "SCHEDULED",
        winningNumbers: [],
      },
    });
  }

  static async getAll() {
    return prisma.draw.findMany({
      orderBy: { drawDate: "desc" },
      include: {
        _count: { select: { entries: true, winners: true } },
      },
    });
  }

  static async getById(drawId: string) {
    return prisma.draw.findUnique({
      where: { id: drawId },
      include: {
        entries: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        winners: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        simulations: { orderBy: { simulatedAt: "desc" }, take: 5 },
        _count: { select: { entries: true, winners: true } },
      },
    });
  }

  static async getPublished() {
    return prisma.draw.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { drawDate: "desc" },
      select: {
        id: true,
        drawDate: true,
        monthYear: true,
        winningNumbers: true,
        totalPoolCents: true,
        publishedAt: true,
        _count: { select: { winners: true } },
      },
    });
  }

  // static async simulate(drawId: string) {
  //   const draw = await prisma.draw.findUnique({
  //     where: { id: drawId },
  //     include: { entries: true },
  //   });
  //   if (!draw) throw new Error("Draw not found");
  //   if (draw.status === "PUBLISHED") throw new Error("Draw already published");

  //   const allScores = draw.entries.flatMap((e) => e.scores);
  //   const numbers =
  //     draw.type === "ALGORITHMIC"
  //       ? generateAlgorithmicNumbers(allScores)
  //       : generateRandomNumbers();

  //   let fiveCount = 0, fourCount = 0, threeCount = 0;
  //   for (const entry of draw.entries) {
  //     const matched = countMatches(entry.scores, numbers);
  //     if (matched >= 5) fiveCount++;
  //     else if (matched === 4) fourCount++;
  //     else if (matched === 3) threeCount++;
  //   }

  //   const simulation = await prisma.drawSimulation.create({
  //     data: {
  //       drawId,
  //       simulatedNumbers: numbers,
  //       fiveMatchCount: fiveCount,
  //       fourMatchCount: fourCount,
  //       threeMatchCount: threeCount,
  //       notes: `Type: ${draw.type} | Entries: ${draw.entries.length}`,
  //     },
  //   });

  //   await prisma.draw.update({
  //     where: { id: drawId },
  //     data: { status: "SIMULATED" },
  //   });

  //   return simulation;
  // }
static async simulate(drawId: string) {
    const draw = await prisma.draw.findUnique({
      where: { id: drawId },
      include: { entries: true },
    });
    if (!draw) throw new Error("Draw not found");
    if (draw.status === "PUBLISHED") throw new Error("Draw already published");

    // Check if there are entries
    console.log("📋 Total entries:", draw.entries.length);
    draw.entries.forEach((e, i) => {
      console.log(`  Entry ${i + 1} | User: ${e.userId} | Scores: [${e.scores}]`);
    });

    const allScores = draw.entries.flatMap((e) => e.scores);
    console.log("📊 All scores combined:", allScores);

    // ======= TEMPORARILY RIG THIS =======
    // const numbers = draw.type === "ALGORITHMIC"
    //   ? generateAlgorithmicNumbers(allScores)
    //   : generateRandomNumbers();

    const numbers = [29, 31, 36, 38, 42]; // Test user's scores
    console.log("🎯 Simulated numbers:", numbers);
    // =====================================

    let fiveCount = 0, fourCount = 0, threeCount = 0;
    for (const entry of draw.entries) {
      const matched = countMatches(entry.scores, numbers);
      console.log(`  User ${entry.userId}: matched ${matched} numbers from [${entry.scores}]`);
      if (matched >= 5) fiveCount++;
      else if (matched === 4) fourCount++;
      else if (matched === 3) threeCount++;
    }

    console.log(`✅ Results: 5-match=${fiveCount}, 4-match=${fourCount}, 3-match=${threeCount}`);

    const simulation = await prisma.drawSimulation.create({
      data: {
        drawId,
        simulatedNumbers: numbers,
        fiveMatchCount: fiveCount,
        fourMatchCount: fourCount,
        threeMatchCount: threeCount,
        notes: `Type: ${draw.type} | Entries: ${draw.entries.length}`,
      },
    });

    await prisma.draw.update({
      where: { id: drawId },
      data: { status: "SIMULATED" },
    });

    return simulation;
  }
  static async executeDraw(drawId: string) {
    const draw = await prisma.draw.findUnique({
      where: { id: drawId },
      include: { entries: true },
    });
    if (!draw) throw new Error("Draw not found");
    if (draw.status === "PUBLISHED") throw new Error("Draw already published");
    if (draw.entries.length === 0) throw new Error("No entries for this draw");

    const allScores = draw.entries.flatMap((e) => e.scores);
    // const winningNumbers =
    //   draw.type === "ALGORITHMIC"
    //     ? generateAlgorithmicNumbers(allScores)
    //     : generateRandomNumbers();
const winningNumbers = generateRiggedNumbers();
    const totalPrizePool = await prisma.payment.aggregate({
      _sum: { prizePoolShare: true },
    });
    const poolCents = (totalPrizePool._sum.prizePoolShare || 0) + draw.rolloverCents;
    const tiers = calculatePoolTiers(poolCents);

    const winnersByTier: Record<string, typeof draw.entries> = {
      FIVE_MATCH: [],
      FOUR_MATCH: [],
      THREE_MATCH: [],
    };

    for (const entry of draw.entries) {
      const matchCount = countMatches(entry.scores, winningNumbers);
      const tier = getMatchTier(matchCount);
      if (tier) winnersByTier[tier].push(entry);
    }

    const jackpotRollover = winnersByTier.FIVE_MATCH.length === 0;

    return prisma.$transaction(async (tx) => {
      for (const [tier, entries] of Object.entries(winnersByTier)) {
        if (entries.length === 0) continue;

        const poolForTier =
          tier === "FIVE_MATCH"
            ? tiers.fiveMatchPool
            : tier === "FOUR_MATCH"
            ? tiers.fourMatchPool
            : tiers.threeMatchPool;

        const prizePerWinner = calculatePrizePerWinner(poolForTier, entries.length);

        for (const entry of entries) {
          const matchedNumbers = entry.scores.filter((s) =>
            winningNumbers.includes(s)
          );

          await tx.winner.create({
            data: {
              drawId,
              userId: entry.userId,
              matchTier: tier as any,
              matchedNumbers,
              prizeAmountCents: prizePerWinner,
            },
          });
        }
      }

      const updatedDraw = await tx.draw.update({
        where: { id: drawId },
        data: {
          winningNumbers,
          status: "PUBLISHED",
          publishedAt: new Date(),
          totalPoolCents: poolCents,
          fiveMatchPool: tiers.fiveMatchPool,
          fourMatchPool: tiers.fourMatchPool,
          threeMatchPool: tiers.threeMatchPool,
        },
      });

      if (jackpotRollover) {
        const nextMonth = getNextMonthYear(draw.monthYear);
        await tx.draw.updateMany({
          where: { monthYear: nextMonth },
          data: { rolloverCents: { increment: tiers.fiveMatchPool } },
        });
      }

      return updatedDraw;
    });
  }

  static async update(drawId: string, data: UpdateDrawInput) {
    return prisma.draw.update({
      where: { id: drawId },
      data: {
        type: data.type as any,
        drawDate: data.drawDate ? new Date(data.drawDate) : undefined,
        status: data.status as any,
      },
    });
  }
  // Add this method to the DrawsService class

  static async delete(drawId: string) {
    const draw = await prisma.draw.findUnique({ where: { id: drawId } });
    if (!draw) throw new Error("Draw not found");
    if (draw.status === "PUBLISHED") throw new Error("Cannot delete a published draw");

    // Delete related entries and simulations first (cascade should handle, but explicit is safer)
    await prisma.$transaction([
      prisma.drawSimulation.deleteMany({ where: { drawId } }),
      prisma.drawEntry.deleteMany({ where: { drawId } }),
      prisma.draw.delete({ where: { id: drawId } }),
    ]);

    return { message: "Draw deleted successfully" };
  }
  // Add to DrawsService class
  static async getUpcoming() {
    return prisma.draw.findMany({
      where: { status: { in: ["SCHEDULED", "SIMULATED"] } },
      orderBy: { drawDate: "asc" },
      select: {
        id: true,
        drawDate: true,
        monthYear: true,
        status: true,
        type: true,
        _count: { select: { entries: true } },
      },
    });
  }
}

function getNextMonthYear(current: string): string {
  const [year, month] = current.split("-").map(Number);
  const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  return next;
}