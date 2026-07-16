import { prisma } from "@xendbox/database"
import { AppError } from "../identity/auth.service"

export async function createVehicle(
  organizationId: string,
  data: {
    type: string
    plate_number?: string
    capacity?: number
  }
) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } })
  if (!org || org.type !== "LOGISTICS_COMPANY") {
    throw new AppError("Vehicles can only be added to logistics companies", 400)
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      organization_id: organizationId,
      type: data.type,
      plate_number: data.plate_number,
      capacity: data.capacity,
    },
  })

  return vehicle
}

export async function listVehicles(organizationId: string) {
  return prisma.vehicle.findMany({
    where: { organization_id: organizationId },
    include: {
      assignments: {
        where: { ended_at: null },
        include: {
          rider: {
            include: {
              user: {
                select: { id: true, first_name: true, last_name: true },
              },
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  })
}

export async function assignVehicle(vehicleId: string, riderId: string, organizationId: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, organization_id: organizationId },
  })
  if (!vehicle) throw new AppError("Vehicle not found in this organization", 404)

  const rider = await prisma.rider.findFirst({
    where: { id: riderId, organization_id: organizationId },
  })
  if (!rider) throw new AppError("Rider not found in this organization", 404)

  const activeAssignment = await prisma.riderVehicle.findFirst({
    where: { rider_id: riderId, ended_at: null },
  })
  if (activeAssignment) throw new AppError("Rider already has an active vehicle assignment", 409)

  const assignment = await prisma.riderVehicle.create({
    data: {
      rider_id: riderId,
      vehicle_id: vehicleId,
    },
    include: {
      rider: {
        include: {
          user: { select: { id: true, first_name: true, last_name: true } },
        },
      },
      vehicle: true,
    },
  })

  return assignment
}

export async function unassignVehicle(vehicleId: string, riderId: string, organizationId: string) {
  const assignment = await prisma.riderVehicle.findFirst({
    where: {
      vehicle_id: vehicleId,
      rider_id: riderId,
      ended_at: null,
      vehicle: { organization_id: organizationId },
    },
  })
  if (!assignment) throw new AppError("Active assignment not found", 404)

  await prisma.riderVehicle.update({
    where: { id: assignment.id },
    data: { ended_at: new Date() },
  })

  return { message: "Vehicle unassigned" }
}
