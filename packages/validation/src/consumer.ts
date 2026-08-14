import { z } from "zod"
import { addressSchema, emailSchema, idSchema, phoneSchema } from "./common"

export const consumerTypeSchema = z.enum(["INDIVIDUAL", "MERCHANT"])

export const createConsumerSchema = z.object({
  type: consumerTypeSchema,
})

export const createRecipientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: phoneSchema,
  address: addressSchema,
})

export const updateRecipientSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: phoneSchema.optional(),
  address: addressSchema,
})

export const createOrderSchema = z.object({
  delivery_option_id: idSchema,
  pickup_address_id: idSchema,
  recipient_id: idSchema,
  price: z.number().positive().finite("Price must be a positive number"),
  pickup_station_id: idSchema.optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "CREATED",
    "PAYMENT_PENDING",
    "PAID",
    "SEARCHING_RIDER",
    "RIDER_ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "ARRIVED_AT_STATION",
    "READY_FOR_COLLECTION",
    "COLLECTED",
    "FAILED",
    "CANCELLED",
  ]),
})