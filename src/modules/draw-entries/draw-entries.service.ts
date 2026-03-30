import { prisma } from "../../config/prisma";

export class DrawEntriesService {
  static async enter(userId: string, drawId: string) {
    // Check draw exists and is open
    const draw = await prisma.draw.findUnique({ where: { id: drawId } });
    if (!draw) throw new Error("Draw not found");
    if (draw.status !== "SCHEDULED") throw new Error("Draw is no longer accepting entries");

    // Check not already entered
    const existing = await prisma.drawEntry.findUnique({
      where: { drawId_userId: { drawId, userId } },
    });
    if (existing) throw new Error("Already entered this draw");

    // User must have 5 scores
    const scores = await prisma.golfScore.findMany({
      where: { userId },
      orderBy: { position: "asc" },
    });
    if (scores.length < 5) throw new Error("You need 5 scores to enter a draw");

    // Snapshot scores at entry time
    const scoreValues = scores.map((s:any) => s.score);

    return prisma.drawEntry.create({
      data: {
        drawId,
        userId,
        scores: scoreValues,
      },
    });
  }

  static async getMyEntries(userId: string) {
    return prisma.drawEntry.findMany({
      where: { userId },
      orderBy: { enteredAt: "desc" },
      include: {
        draw: {
          select: {
            id: true,
            monthYear: true,
            drawDate: true,
            status: true,
            winningNumbers: true,
          },
        },
      },
    });
  }

  static async getEntriesByDraw(drawId: string) {
    return prisma.drawEntry.findMany({
      where: { drawId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }
}