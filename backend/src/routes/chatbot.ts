import express, { Request, Response } from "express";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: "https://api.deepseek.com", // ✅ Correct syntax
});
router.post("/chat", async (req: Request, res: Response) => {
  const { message, sessionId } = req.body;

if (!message || typeof message !== "string" || !sessionId || typeof sessionId !== "string") {
   res.status(400).json({ error: "Message and sessionId must be strings." });
   return;
}


  try {
    // Save user message
    await prisma.chatMessage.create({
      data: { sender: "user", text: message, sessionId },
    });

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: message }],
    });

    const reply = completion.choices[0].message?.content || "No response";

    // Save bot response
    await prisma.chatMessage.create({
      data: { sender: "bot", text: reply, sessionId },
    });

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "AI chat failed." });
  }
});
router.get("/chat/history/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const history = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
    });
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

export default router;
