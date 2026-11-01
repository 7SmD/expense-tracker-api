import { z } from "zod";

export const expenseQuerySchema = z.object({
  month: z
    .string()
    .regex(/^[0-9]{4}-(0[1-9]|1[0-2])$/)
    .optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});
