import { z } from "zod";
import express from "express";
import { registerSchema } from "../schemas/register.js";
import {
  EmailTakenError,
  InvalidCredentialsError,
  loginUser,
  registerUser,
} from "../services/authService.js";
import { loginSchema } from "../schemas/login.js";
import { signToken } from "../lib/jwt.js";

export const authRouter = express.Router();

function sendValidationError(
  res: express.Response,
  error: z.ZodError,
  message: string,
) {
  res
    .status(400)
    .json({ error: message, details: error.issues });
}

authRouter.post("/register", async (req, res) => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendValidationError(res, parseResult.error, "Invalid registration data");
    return;
  }

  try {
    const user = await registerUser(parseResult.data);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof EmailTakenError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
});

authRouter.post("/login", async (req, res) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendValidationError(res, parseResult.error, "Invalid login data");
    return;
  }

  try {
    const user = await loginUser(parseResult.data);
    const token = signToken(user.id);
    res.json({ token });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: error.message });
      return;
    }
    throw error;
  }
});
