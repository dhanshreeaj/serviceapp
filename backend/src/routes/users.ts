// src/routes/users.ts
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// ✅ Get all users
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
router.get("/first-service", async (req, res) => {
  try {
    const service = await prisma.user.findFirst({ where: { role: "service" } });
    if (!service) { res.status(404).json({ message: "No service found" });
    return;}
    res.json({ id: service.id, name: service.name });
  } catch {
    res.status(500).json({ message: "Error fetching service user" });
  }
});

// ✅ GET /api/users/first-service
router.get("/first-service", async (req, res) => {
  try {
    const serviceUser = await prisma.user.findFirst({
      where: { role: "service" },
      select: {
        id: true,
        name: true,
      },
    });

    if (!serviceUser) {
       res.status(404).json({ error: "No service user found" });
       return;
    }

    res.json(serviceUser);
  } catch (err) {
    console.error("Failed to fetch service user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

