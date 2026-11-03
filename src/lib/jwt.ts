import "dotenv/config";
import jwt from "jsonwebtoken";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

const secret = requireEnv("JWT_SECRET");

export function signToken(userId: number): string {
  return jwt.sign({}, secret, { subject: String(userId), expiresIn: "15m" });
}