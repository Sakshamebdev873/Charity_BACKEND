import { prisma } from "../../config/prisma";

export class DrawSimulationsService {
  static async getByDraw(drawId: string) {
    return prisma.drawSimulation.findMany({
      where: { drawId },
      orderBy: { simulatedAt: "desc" },
    });
  }

  static async getById(id: string) {
    return prisma.drawSimulation.findUnique({ where: { id } });
  }

  static async delete(id: string) {
    return prisma.drawSimulation.delete({ where: { id } });
  }
}