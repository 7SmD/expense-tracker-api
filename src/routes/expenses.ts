import express from "express";
import type { z } from "zod";
import {
  createExpense,
  deleteExpense,
  getExpense,
  listExpenses,
  replaceExpense,
} from "../services/expenseService.js";
import { expenseSchema } from "../schemas/expense.js";
export const expensesRouter = express.Router();

function parseExpenseId(value: string): number | undefined {
  const expenseId = Number(value);
  if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
    return undefined;
  }

  return expenseId;
}

function sendValidationError(res: express.Response, error: z.ZodError) {
  res
    .status(400)
    .json({ error: "Invalid expense data", details: error.issues });
}

expensesRouter.get("/", async (_req, res) => {
  res.json(await listExpenses());
});

expensesRouter.get("/:id", async (req, res) => {
  const expenseId = parseExpenseId(req.params.id);
  if (expenseId === undefined) {
    res.status(400).json({ error: "Invalid expense id" });
    return;
  }

  const expense = await getExpense(expenseId);
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

  const expense = await createExpense(parseResult.data);
  res.status(201).json(expense);
});

expensesRouter.put("/:id", async(req, res) => {
  const expenseId =  parseExpenseId(req.params.id);
  if (expenseId === undefined) {
    res.status(400).json({ error: "Invalid expense id" });
    return;
  }

  const parseResult = expenseSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendValidationError(res, parseResult.error);
    return;
  }

  const expense = await replaceExpense(expenseId, parseResult.data);
  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json(expense);
});

expensesRouter.delete("/:id", async (req, res) => {
  const expenseId = await parseExpenseId(req.params.id);
  if (expenseId === undefined) {
    res.status(400).json({ error: "Invalid expense id" });
    return;
  }

  if (!(await deleteExpense(expenseId))) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.status(204).send();
});
