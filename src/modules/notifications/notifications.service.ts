import { prisma } from "../../config/prisma";
import { CreateNotificationInput } from "./notifications.schema";

export class NotificationsService {
  static async getByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notif) throw new Error("Notification not found");
    if (notif.userId !== userId) throw new Error("Unauthorized");

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // Used internally by other services
  static async create(data: CreateNotificationInput) {
    return prisma.notification.create({ data });
  }

  // Bulk notify all active subscribers
  static async notifyAllSubscribers(title: string, body: string, type: string, metadata?: any) {
    const activeUsers = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { userId: true },
    });

    const notifications = activeUsers.map((sub:any) => ({
      userId: sub.userId,
      title,
      body,
      type,
      metadata,
    }));

    return prisma.notification.createMany({ data: notifications });
  }
}