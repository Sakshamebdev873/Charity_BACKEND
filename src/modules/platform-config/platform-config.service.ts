import { prisma } from "../../config/prisma";
import { UpsertConfigInput } from "./platform-config.schema";

export class PlatformConfigService {
  static async getAll() {
    return prisma.platformConfig.findMany({ orderBy: { key: "asc" } });
  }

  static async getByKey(key: string) {
    return prisma.platformConfig.findUnique({ where: { key } });
  }

  static async upsert(data: UpsertConfigInput) {
    return prisma.platformConfig.upsert({
      where: { key: data.key },
      create: data,
      update: { value: data.value },
    });
  }

  static async delete(key: string) {
    return prisma.platformConfig.delete({ where: { key } });
  }

  // Helper to get typed config value
  static async getValue(key: string, fallback: string = ""): Promise<string> {
    const config = await prisma.platformConfig.findUnique({ where: { key } });
    return config?.value ?? fallback;
  }

  static async getNumberValue(key: string, fallback: number = 0): Promise<number> {
    const val = await this.getValue(key, String(fallback));
    return Number(val);
  }
}