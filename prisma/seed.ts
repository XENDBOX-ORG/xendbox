import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const home = await prisma.deliveryOption.upsert({
    where: { type: "HOME" },
    update: {},
    create: { type: "HOME" },
  })

  const station = await prisma.deliveryOption.upsert({
    where: { type: "PICKUP_STATION" },
    update: {},
    create: { type: "PICKUP_STATION" },
  })

  console.log(`Seeded delivery options: ${home.type}, ${station.type}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
