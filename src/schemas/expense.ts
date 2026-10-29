import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.int().gt(0),
  description: z.string().trim().nonempty(),
  date: z.iso.date(),
  categoryId: z.int().gt(0),
});