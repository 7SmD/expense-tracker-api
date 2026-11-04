import "dotenv/config";
import jwt from "jsonwebtoken";
import { requireEnv } from "./env.js";



const secret = requireEnv("JWT_SECRET");

export function signToken(userId: number): string {
  return jwt.sign({}, secret, { subject: String(userId), expiresIn: "15m" });
}