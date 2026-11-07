import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const password = "correct horse";

async function createExpenses(dates: string[]) {
  const email = "pagination@example.com";
  const registration = await request(app)
    .post("/auth/register")
    .send({ email, password });
  expect(registration.status).toBe(201);

  const login = await request(app).post("/auth/login").send({ email, password });
  expect(login.status).toBe(200);
  const token = login.body.token as string;
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const category = await prisma.category.create({
    data: { name: "pagination" },
  });

  await prisma.expense.createMany({
    data: dates.map((date, index) => ({
      amount: 100 + index,
      description: `expense-${index}`,
      date: new Date(`${date}T00:00:00.000Z`),
      categoryId: category.id,
      userId: user.id,
    })),
  });

  return { token, userId: user.id };
}

async function getExpenses(token: string, query = "") {
  return request(app)
    .get(`/expenses${query}`)
    .set("Authorization", `Bearer ${token}`);
}

describe("expense pagination", () => {
  it("returns the default page, limit, and total", async () => {
    const { token } = await createExpenses([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
    ]);

    const res = await getExpenses(token);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, limit: 20, total: 3 });
    expect(res.body.items).toHaveLength(3);
  });

  it("returns disjoint pages and orders equal-date rows by descending id", async () => {
    const { token, userId } = await createExpenses(
      Array.from({ length: 10 }, () => "2026-11-01"),
    );
    const inserted = await prisma.expense.findMany({
      where: { userId },
      orderBy: { id: "asc" },
    });

    const page1 = await getExpenses(token, "?limit=2&page=1");
    const page2 = await getExpenses(token, "?limit=2&page=2");
    const page1Ids = page1.body.items.map((item: { id: number }) => item.id);
    const page2Ids = page2.body.items.map((item: { id: number }) => item.id);
    const expectedDescendingIds = inserted.map(({ id }) => id).reverse();

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    expect(page1.body.items).toHaveLength(2);
    expect(page2.body.items).toHaveLength(2);
    expect(page1Ids).toEqual(expectedDescendingIds.slice(0, 2));
    expect(page2Ids).toEqual(expectedDescendingIds.slice(2, 4));
    expect(page1Ids.some((id: number) => page2Ids.includes(id))).toBe(false);
  });

  it("returns an empty page beyond the available results without changing total", async () => {
    const { token } = await createExpenses(["2026-11-01", "2026-11-02"]);

    const res = await getExpenses(token, "?page=999");

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(999);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(2);
  });

  it.each(["?page=0", "?limit=101", "?limit=abc"])(
    "rejects invalid pagination query %s",
    async (query) => {
      const { token } = await createExpenses([]);

      const res = await getExpenses(token, query);

      expect(res.status).toBe(400);
    },
  );

  it("orders by newest date first and breaks ties by higher id", async () => {
    const { token, userId } = await createExpenses([
      "2026-11-01",
      "2026-11-03",
      "2026-11-03",
      "2026-10-30",
      "2026-11-01",
    ]);
    const inserted = await prisma.expense.findMany({
      where: { userId },
      orderBy: { id: "asc" },
    });
    const res = await getExpenses(token);

    expect(res.status).toBe(200);
    expect(res.body.items.map((item: { date: string }) => item.date)).toEqual([
      "2026-11-03",
      "2026-11-03",
      "2026-11-01",
      "2026-11-01",
      "2026-10-30",
    ]);
    for (const date of ["2026-11-03", "2026-11-01"]) {
      const idsForDate = res.body.items
        .filter((item: { date: string }) => item.date === date)
        .map((item: { id: number }) => item.id);
      const expectedIds = inserted
        .filter((item) => item.date.toISOString().slice(0, 10) === date)
        .map(({ id }) => id)
        .reverse();
      expect(idsForDate).toEqual(expectedIds);
    }
  });

  it("counts only expenses in the requested month", async () => {
    const { token } = await createExpenses([
      "2026-11-01",
      "2026-11-15",
      "2026-10-31",
      "2026-12-01",
    ]);

    const res = await getExpenses(token, "?month=2026-11");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items.map((item: { date: string }) => item.date)).toEqual([
      "2026-11-15",
      "2026-11-01",
    ]);
  });
});