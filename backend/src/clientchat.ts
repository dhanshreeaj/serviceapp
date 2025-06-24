import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import authenticate, { AuthenticatedRequest } from './middleware/authen';


const router = express.Router();
const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// ✅ SOCKET.IO Message Handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId: number) => {
    socket.join(userId.toString());
    console.log(`User ${userId} joined room`);
  });

  socket.on("send_message", async ({ token, content }) => {
    try {
      if (!token) return;

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-jwt-secret") as { id: number };
      const senderId = decoded.id;

      const sender = await prisma.user.findUnique({ where: { id: senderId } });
      if (!sender) return;

      let receiver;

      if (sender.role === "user") {
        // 🧍 User sends to first available service
        receiver = await prisma.user.findFirst({ where: { role: "service" } });
      } else if (sender.role === "service") {
        // 🧑‍🔧 Service replies to most recent user who sent a message
        const lastMsg = await prisma.message.findFirst({
          where: { receiverId: senderId },
          orderBy: { id: "desc" },
        });

        if (lastMsg) {
          receiver = await prisma.user.findUnique({ where: { id: lastMsg.senderId } });
        }
      }

      if (!receiver) {
        console.warn("No receiver found");
        return;
      }

      const message = await prisma.message.create({
        data: {
          senderId: sender.id,
          receiverId: receiver.id,
          content,
        },
      });

      io.to(receiver.id.toString()).emit("receive_message", message);
      io.to(sender.id.toString()).emit("receive_message", message);
    } catch (err) {
      console.error("Message error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ✅ START SERVER
server.listen(5000, () => {
  console.log("Socket server running on http://localhost:5000");
});

// ✅ GET /api/messages - Full chat history OR with specific user
app.get("/api/messages", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const withId = req.query.with ? Number(req.query.with) : null;

  if (!token) { res.status(401).json({ error: "Unauthorized" });
  return;}

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-jwt-secret") as { id: number };
    const userId = decoded.id;

    if (withId) {
      // 📩 Messages between current user and specific user
      const conversation = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: withId },
            { senderId: withId, receiverId: userId },
          ],
        },
        orderBy: { id: "asc" },
      });

      res.json(conversation);
      return ;
    }

    // 📜 Return all messages sent or received by this user
    const allMessages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { id: "asc" },
    });

    res.json(allMessages);
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});
router.get('/messages', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: {
        id: 'asc'
      }
    });

    res.json(messages);
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});