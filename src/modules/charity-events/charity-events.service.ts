import { prisma } from "../../config/prisma";
import { CreateCharityEventInput, UpdateCharityEventInput } from "./charity-events.schema";

export class CharityEventsService {
  static async getByCharity(charityId: string) {
    return prisma.charityEvent.findMany({
      where: { charityId, isPublished: true },
      orderBy: { eventDate: "asc" },
    });
  }

  static async getUpcoming() {
    return prisma.charityEvent.findMany({
      where: { isPublished: true, eventDate: { gte: new Date() } },
      orderBy: { eventDate: "asc" },
      take: 10,
      include: { charity: { select: { id: true, name: true, slug: true } } },
    });
  }

  static async create(data: CreateCharityEventInput) {
    return prisma.charityEvent.create({
      data: {
        charityId: data.charityId,
        title: data.title,
        description: data.description,
        eventDate: new Date(data.eventDate),
        location: data.location,
        imageUrl: data.imageUrl,
        isPublished: data.isPublished,
      },
    });
  }

  static async update(id: string, data: UpdateCharityEventInput) {
    return prisma.charityEvent.update({
      where: { id },
      data: {
        ...data,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
      },
    });
  }

  static async delete(id: string) {
    return prisma.charityEvent.delete({ where: { id } });
  }
}