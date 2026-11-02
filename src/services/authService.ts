import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import type { z } from "zod";
import type { registerSchema } from "../schemas/register.js";

const SALT_ROUNDS = 12;

export type RegisterData = z.infer<typeof registerSchema>;

export class EmailTakenError extends Error {
  constructor() {
    super("Email already registered");
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
