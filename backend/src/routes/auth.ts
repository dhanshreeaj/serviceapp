import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

// Register
router.post("/register", (req: Request, res: Response): void => {
  const { name, email, password } = req.body;

  prisma.user.findUnique({ where: { email } })
    .then((existingUser: any) => {
      if (existingUser) {
        res.status(400).json({ error: "Email already registered" });
        return; // Don't return response object
      }

      return bcrypt.hash(password, 10)
        .then((hashedPassword: string) => {
          const role = email === "admin@example.com" ? "admin" : "user";
          return prisma.user.create({
            data: { name, email, password: hashedPassword, role }
          });
        })
        .then(() => {
          res.status(201).json({ message: "User registered successfully" });
        });
    })
    .catch((error: unknown) => {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Server error" });
    });
});

// Login
router.post("/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  prisma.user.findUnique({ where: { email } })
    .then((user: any) => { // ⬅️ Fix here
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      return bcrypt.compare(password, user.password)
        .then((match: boolean) => {
          if (!match) {
            return res.status(401).json({ error: "Invalid email or password" });
          }

          const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            SECRET_KEY,
            { expiresIn: "1h" }
          );

          res.json({ message: "Login successful", token, role: user.role });
        });
    })
    .catch((error: unknown) => { // ⬅️ Fix here
      console.error("Login error:", error);
      res.status(500).json({ error: "Server error" });
    });
});


export default router;
