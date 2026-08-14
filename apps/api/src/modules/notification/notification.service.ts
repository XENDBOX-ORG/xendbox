import { prisma } from "@xendbox/database"
import { AppError } from "../../shared/errors"

export async function listNotifications(userId: string, page: number, limit: number, unreadOnly?: boolean) {
  const where = { user_id: userId, ...(unreadOnly ? { read_at: null } : {}) }
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ])

  const unread = await prisma.notification.count({ where: { user_id: userId, read_at: null } })

  return { items, total, page, limit, unread }
}

export async function markRead(userId: string, notificationId: string) {
  const updated = await prisma.notification.updateMany({
    where: { id: notificationId, user_id: userId },
    data: { read_at: new Date() },
  })
  if (updated.count === 0) throw new AppError("Notification not found", 404)
  return { message: "Notification marked as read" }
}

export async function markAllRead(userId: string) {
  const updated = await prisma.notification.updateMany({
    where: { user_id: userId, read_at: null },
    data: { read_at: new Date() },
  })
  return { message: `Marked ${updated.count} notification(s) as read` }
}