import { prisma } from "../../config/prisma";
import { AddScoreInput, UpdateScoreInput } from "./scores.schema";

const MAX_SCORES = 5;

export class ScoresService {
  /**
   * Add a new score. If user already has 5, the oldest is replaced.
   * Scores are maintained in position 1 (newest) to 5 (oldest).
   */
  static async addScore(userId: string, data: AddScoreInput) {
    const existing = await prisma.golfScore.findMany({
      where: { userId },
      orderBy: { position: "asc" },
    });

    return prisma.$transaction(async (tx:any) => {
      if (existing.length >= MAX_SCORES) {
        // Shift all positions up by 1 (pos 1→2, 2→3, etc.)
        // Delete the one at position 5 (oldest)
        await tx.golfScore.delete({
          where: { userId_position: { userId, position: MAX_SCORES } },
        });

        // Shift remaining scores
        for (let pos = MAX_SCORES - 1; pos >= 1; pos--) {
          const scoreAtPos = existing.find((s:any) => s.position === pos);
          if (scoreAtPos) {
            await tx.golfScore.update({
              where: { id: scoreAtPos.id },
              data: { position: pos + 1 },
            });
          }
        }
      } else {
        // Shift existing scores to make room at position 1
        for (let pos = existing.length; pos >= 1; pos--) {
          const scoreAtPos = existing.find((s:any) => s.position === pos);
          if (scoreAtPos) {
            await tx.golfScore.update({
              where: { id: scoreAtPos.id },
              data: { position: pos + 1 },
            });
          }
        }
      }

      // Insert new score at position 1
      return tx.golfScore.create({
        data: {
          userId,
          score: data.score,
          playedOn: new Date(data.playedOn),
          position: 1,
        },
      });
    });
  }

  static async getByUser(userId: string) {
    return prisma.golfScore.findMany({
      where: { userId },
      orderBy: { position: "asc" }, // 1 = newest
    });
  }

  static async updateScore(scoreId: string, userId: string, data: UpdateScoreInput) {
    const score = await prisma.golfScore.findUnique({ where: { id: scoreId } });
    if (!score) throw new Error("Score not found");
    if (score.userId !== userId) throw new Error("Unauthorized");

    return prisma.golfScore.update({
      where: { id: scoreId },
      data: {
        score: data.score,
        playedOn: data.playedOn ? new Date(data.playedOn) : undefined,
      },
    });
  }

  // Admin: edit any user's score
  static async adminUpdateScore(scoreId: string, data: UpdateScoreInput) {
    return prisma.golfScore.update({
      where: { id: scoreId },
      data: {
        score: data.score,
        playedOn: data.playedOn ? new Date(data.playedOn) : undefined,
      },
    });
  }

  // Admin: get scores for any user
  static async adminGetByUser(userId: string) {
    return prisma.golfScore.findMany({
      where: { userId },
      orderBy: { position: "asc" },
    });
  }
}