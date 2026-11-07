import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

const credentials = { email: "a@example.com", password: "correct horse" };

async function registerUser(
  email = credentials.email,
  password = credentials.password,
) {
  return request(app).post("/auth/register").send({ email, password });
}

describe("auth", () => {
  it("registers a new user and never returns the hash", async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.email).toBe("a@example.com");
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("rejects a duplicate email with 409", async () => {
    await registerUser();

    const res = await registerUser();

    expect(res.status).toBe(409);
  });

  it("rejects a short password with 400", async () => {
    const res = await registerUser(credentials.email, "short");

    expect(res.status).toBe(400);
  });

  it("logs in and returns a token", async () => {
    await registerUser();

    const res = await request(app).post("/auth/login").send(credentials);

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("returns the same 401 for a wrong password and an unknown email", async () => {
    await registerUser();

    const wrongPassword = await request(app)
      .post("/auth/login")
      .send({ ...credentials, password: "wrong password" });
    const unknownEmail = await request(app)
      .post("/auth/login")
      .send({ email: "unknown@example.com", password: credentials.password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });

  it("returns 401 for a protected route without a token", async () => {
    const res = await request(app).get("/expenses");

    expect(res.status).toBe(401);
  });
});