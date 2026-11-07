import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const password = "correct horse";
const expenseData = {
  amount: 1250,
  description: "ownership test",
  date: "2026-11-07",
};

async function signUp(email: string): Promise<string> {
  const registration = await request(app)
    .post("/auth/register")
    .send({ email, password });
  expect(registration.status).toBe(201);

  const res = await request(app).post("/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

async function createCategory() {
  return prisma.category.create({
    data: { name: "ownership" },
  });
}

async function createExpenseForOwner() {
  const token = await signUp("owner@example.com");
  const category = await createCategory();
  const res = await request(app)
    .post("/expenses")
    .set("Authorization", `Bearer ${token}`)
    .send({ ...expenseData, categoryId: category.id });

  expect(res.status).toBe(201);
  return { token, id: res.body.id as number, categoryId: category.id };
}

describe("expense ownership", () => {
  it("creates an expense owned by the authenticated user", async () => {
    const { id } = await createExpenseForOwner();
    const storedExpense = await prisma.expense.findUnique({ where: { id } });
    const owner = await prisma.user.findUnique({
      where: { email: "owner@example.com" },
    });

    expect(storedExpense).not.toBeNull();
    expect(storedExpense?.userId).toBe(owner?.id);
  });

  it("uses the authenticated user instead of a userId in the request body", async () => {
    const token = await signUp("owner@example.com");
    const owner = await prisma.user.findUnique({
      where: { email: "owner@example.com" },
    });
    const category = await createCategory();
    const res = await request(app)
      .post("/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...expenseData, categoryId: category.id, userId: 999 });
    expect(res.status).toBe(201);

    const storedExpense = await prisma.expense.findUnique({
      where: { id: res.body.id },
    });

    expect(storedExpense?.userId).toBe(owner?.id);
  });

  it("lists only the authenticated user's expenses", async () => {
    const { token } = await createExpenseForOwner();
    const res = await request(app)
      .get("/expenses")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].description).toBe(expenseData.description);
    expect(res.body.total).toBe(1);
  });

  it("returns an empty list to another user", async () => {
    await createExpenseForOwner();
    const otherToken = await signUp("other@example.com");
    const res = await request(app)
      .get("/expenses")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it("returns 404 when another user gets an expense", async () => {
    const { id } = await createExpenseForOwner();
    const otherToken = await signUp("other@example.com");
    const res = await request(app)
      .get(`/expenses/${id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 when another user updates an expense and leaves it unchanged", async () => {
    const { token: ownerToken, id, categoryId } = await createExpenseForOwner();
    const otherToken = await signUp("other@example.com");
    const update = await request(app)
      .put(`/expenses/${id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ ...expenseData, amount: 9999, categoryId });

    expect(update.status).toBe(404);

    const ownerRead = await request(app)
      .get(`/expenses/${id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(ownerRead.status).toBe(200);
    expect(ownerRead.body.amount).toBe(expenseData.amount);
  });

  it("returns 404 when another user deletes an expense and leaves it intact", async () => {
    const { token: ownerToken, id } = await createExpenseForOwner();
    const otherToken = await signUp("other@example.com");
    const deletion = await request(app)
      .delete(`/expenses/${id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(deletion.status).toBe(404);

    const ownerRead = await request(app)
      .get(`/expenses/${id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(ownerRead.status).toBe(200);
    expect(ownerRead.body.amount).toBe(expenseData.amount);
  });

  it("requires a token for GET, POST, PUT, and DELETE expenses", async () => {
    const category = await createCategory();
    const body = { ...expenseData, categoryId: category.id };
    const requests = [
      request(app).get("/expenses"),
      request(app).post("/expenses").send(body),
      request(app).put("/expenses/1").send(body),
      request(app).delete("/expenses/1"),
    ];

    const responses = await Promise.all(requests);
    expect(responses.map((res) => res.status)).toEqual([401, 401, 401, 401]);
  });
});
