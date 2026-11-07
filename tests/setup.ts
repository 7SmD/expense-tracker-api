import { beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma.js";

if (!process.env["DATABASE_URL"]?.includes("expense_api_test")) {
  throw new Error("Refusing to run tests against a non-test database");
}

beforeEach(async () => {
  await prisma.expense.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
});
