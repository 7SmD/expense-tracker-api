import express from "express";
import {
  createExpense,
  deleteExpense,
  getExpense,
  listExpenses,
  replaceExpense,
} from "../services/expenseService.js";

export const expensesRouter = express.Router();

function parseExpenseId(value: string): number | undefined {
  const expenseId = Number(value);
  if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
    return undefined;
  }

  return expenseId;
}

expensesRouter.get("/", (_req, res) => {
  res.json(listExpenses());
});

expensesRouter.get("/:id", (req, res) => {
  const expenseId = parseExpenseId(req.params.id);
  if (expenseId === undefined) {
    res.status(400).json({ error: "Invalid expense id" });
    return;
  }

  const expense = getExpense(expenseId);
  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json(expense);
});

expensesRouter.post("/", (req, res) => {
  const expense = createExpense(req.body);
  res.status(201).json(expense);
});

expensesRouter.put("/:id", (req, res) => {
  const expenseId = parseExpenseId(req.params.id);
  if (expenseId === undefined) {
    res.status(400).json({ error: "Invalid expense id" });
    return;
  }

  const expense = replaceExpense(expenseId, req.body);
  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json(expense);
});

expensesRouter.delete("/:id", (req, res) => {
  const expenseId = parseExpenseId(req.params.id);
  if (expenseId === undefined) {
    res.status(400).json({ error: "Invalid expense id" });
    return;
  }

  if (!deleteExpense(expenseId)) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.status(204).send();
});
