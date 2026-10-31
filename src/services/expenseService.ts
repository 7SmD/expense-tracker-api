import type { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

import type { expenseSchema } from "../schemas/expense.js";

export type ExpenseData = z.infer<typeof expenseSchema>;
export type Expense = ExpenseData & { id: number };

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export class InvalidCategoryError extends Error {
  constructor() {
    super("Category does not exist");
  }
}

export async function listExpenses() {
  return prisma.expense.findMany();
}

export async function getExpense(id: number) {
  return prisma.expense.findUnique({ where: { id } });
}

export async function createExpense(data: ExpenseData) {
  try {
    return await prisma.expense.create({
      data: {
        amount: data.amount,
        description: data.description,
        date: new Date(data.date),
        categoryId: data.categoryId,
      },
    });
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      throw new InvalidCategoryError();
    }
    throw error;
  }
}

export async function replaceExpense(id: number, data: ExpenseData) {
  try {
    return await prisma.expense.update({
      where: { id },
      data: {
        amount: data.amount,
        description: data.description,
        date: new Date(data.date),
        categoryId: data.categoryId,
      },
    });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      return null;
    }
    throw error;
  }
}

export async function deleteExpense(id: number): Promise<boolean> {
  try {
    await prisma.expense.delete({ where: { id } });
    return true;
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      return false;
    }
    throw error;
  }
}
