import { prisma } from "@xendbox/database"
import { AppError } from "../../shared/errors"

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization_members: {
        include: {
          organization: true,
        },
      },
    },
  })

  if (!user) throw new AppError("User not found", 404)

  const { password_hash, ...safe } = user
  return safe
}
