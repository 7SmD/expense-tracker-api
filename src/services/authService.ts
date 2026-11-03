import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import type { z } from "zod";
import type { registerSchema } from "../schemas/register.js";
import type { LoginData } from "../schemas/login.js";

const SALT_ROUNDS = 12;

export type RegisterData = z.infer<typeof registerSchema>;

export class EmailTakenError extends Error {
  constructor() {
    super("Email already registered");
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
  }
}

export async function registerUser(data: RegisterData) {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  try {
    return await prisma.user.create({
      data: { email: data.email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new EmailTakenError();
    }
    throw error;
  }
}


// A real bcrypt hash of a throwaway string, computed once at startup.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", SALT_ROUNDS);

export async function loginUser(data: LoginData) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  const hashToCheck = user ? user.passwordHash : DUMMY_HASH;
  const passwordMatches = await bcrypt.compare(data.password, hashToCheck);

  if (!user || !passwordMatches) {
    throw new InvalidCredentialsError();
  }

  return { id: user.id, email: user.email };
}