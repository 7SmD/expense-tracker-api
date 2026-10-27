import express from "express";
import { expensesRouter } from "./routes/expenses.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/expenses", expensesRouter);

app.get(`/health`, (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
