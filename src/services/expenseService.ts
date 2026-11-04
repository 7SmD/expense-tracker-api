import type { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { isPrismaError } from "../lib/prismaError.js";
import { Prisma } from "../generated/prisma/client.js";

import type { expenseSchema } from "../schemas/expense.js";
import type { Expense } from "../generated/prisma/client.js";

type ExpenseFilters = {
  month?: string | undefined;
  categoryId?: number | undefined;
};

export type ExpenseData = z.infer<typeof expenseSchema>;

function toResponse(expense: Expense) {
  return { ...expense, date: expense.date.toISOString().slice(0, 10) };
}

export class InvalidCategoryError extends Error {
  constructor() {
    super("Category does not exist");
  }
}

export async function listExpenses(filters: ExpenseFilters = {}) {
  const where: Prisma.ExpenseWhereInput = {};

  if (filters.categoryId !== undefined) {
    where.categoryId = filters.categoryId;
  }

  if (filters.month !== undefined) {
    const [year, month] = filters.month.split("-").map(Number);
    if (year === undefined || month === undefined) {
      throw new Error("Invalid month");
    }
    // start = first day of that month, end = first day of the NEXT month
    where.date = {
      gte: new Date(Date.UTC(year, month - 1, 1)),
      lt: new Date(Date.UTC(year, month, 1)),
    };
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });
  return expenses.map(toResponse);
}

export async function getExpense(id: number) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  return expense === null ? null : toResponse(expense);
}

export async function createExpense(data: ExpenseData, userId: number) {
  try {
    const expense = await prisma.expense.create({
      data: {
        amount: data.amount,
        description: data.description,
        date: new Date(data.date),
        categoryId: data.categoryId,
        userId: userId,
      },
    });
    return toResponse(expense);
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      throw new InvalidCategoryError();
    }
    throw error;
  }
}

export async function replaceExpense(id: number, data: ExpenseData) {
  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        amount: data.amount,
        description: data.description,
        date: new Date(data.date),
        categoryId: data.categoryId,
      },
    });
    return toResponse(expense);
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      return null;
    }
    if (isPrismaError(error, "P2003")) {
      throw new InvalidCategoryError();
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
