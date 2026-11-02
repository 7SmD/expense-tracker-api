import { z } from "zod";
import express from "express";
import { registerSchema } from "../schemas/register.js";
import { EmailTakenError, registerUser } from "../services/authService.js";

export const authRouter = express.Router();

function sendValidationError(res: express.Response, error: z.ZodError) {
  res
    .status(400)
    .json({ error: "Invalid registration data", details: error.issues });
}

authRouter.post("/register", async (req, res) => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendValidationError(res, parseResult.error);
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
