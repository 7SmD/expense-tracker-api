import express from "express";
import type { z } from "zod";
import {
  createExpense,
  deleteExpense,
  getExpense,
  InvalidCategoryError,
  listExpenses,
  replaceExpense,
} from "../services/expenseService.js";
import { expenseSchema } from "../schemas/expense.js";
import { parseId } from "../lib/parseId.js";
import { expenseQuerySchema } from "../schemas/expenseQuery.js";
import { getUserId } from "../middleware/requireAuth.js";

export const expensesRouter = express.Router();

function sendValidationError(res: express.Response, error: z.ZodError) {
  res
    .status(400)
    .json({ error: "Invalid expense data", details: error.issues });
}

expensesRouter.get("/", async (req, res) => {
  const parseResult = expenseQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({
      error: "Invalid expense query parameters",
      details: parseResult.error.issues,
    });
    return;
  }

  res.json(await listExpenses(getUserId(res), parseResult.data));
});

expensesRouter.get("/:id", async (req, res) => {
  const expenseId = parseId(req.params.id);
  if (expenseId === undefined) {
    res.status(400).json({ error: "Invalid expense id" });
    return;
  }

  const expense = await getExpense(getUserId(res), expenseId);
  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json(expense);
});

expensesRouter.post("/", async (req, res) => {
  const parseResult = expenseSchema.safeParse(req.body);

  if (!parseResult.success) {
    sendValidationError(res, parseResult.error);
    return;
  }

  try {
    const expense = await createExpense(getUserId(res), parseResult.data);
    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof InvalidCategoryError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
});

expensesRouter.put("/:id", async (req, res) => {
  const expenseId = parseId(req.params.id);
  if (expenseId === undefined) {
    res.status(400).json({ error: "Invalid expense id" });
    return;
  }

  const parseResult = expenseSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendValidationError(res, parseResult.error);
    return;
  }

  try {
    const expense = await replaceExpense(
      getUserId(res),
      expenseId,
      parseResult.data,
    );
    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }
    res.json(expense);
  } catch (error) {
    if (error instanceof InvalidCategoryError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
});

expensesRouter.delete("/:id", async (req, res) => {
  const expenseId = parseId(req.params.id);
  if (expenseId === undefined) {
    res.status(400).json({ error: "Invalid expense id" });
    return;
  }

  if (!(await deleteExpense(getUserId(res), expenseId))) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.status(204).send();
});
