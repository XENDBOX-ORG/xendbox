import { z } from "zod"
import { emailSchema } from "./common"

export const waitlistConfirmSchema = z.object({
  email: emailSchema,
  name: z.string().optional(),
})