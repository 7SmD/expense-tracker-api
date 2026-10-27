export interface Expense {
  id: number;
  [key: string]: unknown;
}

export type ExpenseData = Record<string, unknown>;

const expenses: Expense[] = [];
let nextExpenseId = 1;

export function listExpenses(): Expense[] {
  return [...expenses];
}

export function getExpense(id: number): Expense | undefined {
  return expenses.find((expense) => expense.id === id);
}

export function createExpense(data: ExpenseData): Expense {
  const expense = { ...data, id: nextExpenseId++ };
  expenses.push(expense);
  return expense;
}

export function replaceExpense(
  id: number,
  data: ExpenseData,
): Expense | undefined {
  const expenseIndex = expenses.findIndex((expense) => expense.id === id);
  if (expenseIndex === -1) {
    return undefined;
  }

  const expense = { ...data, id };
  expenses[expenseIndex] = expense;
  return expense;
}

export function deleteExpense(id: number): boolean {
  const expenseIndex = expenses.findIndex((expense) => expense.id === id);
  if (expenseIndex === -1) {
    return false;
  }

  expenses.splice(expenseIndex, 1);
  return true;
}
