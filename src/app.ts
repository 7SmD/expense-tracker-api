import express from "express";
import type { NextFunction, Request, Response } from "express";

import { expensesRouter } from "./routes/expenses.js";
import { categoriesRouter } from "./routes/categories.js";
import { authRouter } from "./routes/auth.js";
import { requireAuth } from "./middleware/requireAuth.js";

export const app = express();

app.disable("x-powered-by");

app.use(express.json());
app.use("/expenses", requireAuth, expensesRouter);
app.use("/categories", requireAuth, categoriesRouter);
app.use("/auth", authRouter);

app.get(`/health`, (req, res) => {
  res.json({ status: "ok" });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (
    err instanceof SyntaxError &&
    "type" in err &&
    err.type === "entity.parse.failed"
  ) {
    res.status(400).json({ error: "Malformed JSON" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
