import express, { Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authen";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const router = express.Router();

router.get("/", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || typeof req.user === "string") {
    res.status(403).json({ error: "Invalid token payload" });
    return;
  }

  res.json({ message: `Welcome, user ${req.user.email}` });
});

export default router;
