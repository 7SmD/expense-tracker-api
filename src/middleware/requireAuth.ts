import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { requireEnv } from "../lib/env.js";

const secret = requireEnv("JWT_SECRET");

export function getUserId(res: Response): number {
  const id: unknown = res.locals["userId"];
  if (typeof id !== "number") {
    throw new Error("getUserId called on a route without requireAuth");
  }
  return id;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), secret);
    // payload.sub holds the user id as text; convert it to a number
    // and attach it so the route can read it

    if (typeof payload === "string" || typeof payload.sub !== "string") {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    res.locals["userId"] = userId;

    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
