import express from "express";
import http from "http";
import { Server } from "socket.io";
import session from 'express-session';
import cors from "cors";
import bodyParser from 'body-parser';
import passport from './config/passport';
import { PrismaClient } from "@prisma/client";
import authenticate, { AuthenticatedRequest } from './middleware/authen';

import authRoutes from "./routes/auth";
import homeRoutes from "./routes/home";
import userRoutes from "./routes/users";
import bookingRoutes from "./routes/bookings";
import paymentRoutes from "./routes/payments";
import feedbackRoutes from "./routes/feedback";
import chatbotRoute from "./routes/chatbot";
import jwt from "jsonwebtoken";


const router = express.Router();
const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app); // 👈 Create HTTP server

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// ✅ Express setup
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ Session + Passport
app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api", chatbotRoute);

// ✅ Socket.IO handlers
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId: number) => {
    socket.join(userId.toString());
    console.log(`User ${userId} joined their room`);
  });

socket.on("send_message", async ({ token, content }) => {
  try {
    if (!token) return;

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-jwt-secret") as { id: number };
    const senderId = decoded.id;

    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) {
      console.warn("Sender not found");
      return;
    }

    let receiver;

    if (sender.role === "user") {
      // User → send to first available service
      receiver = await prisma.user.findFirst({ where: { role: "service" } });
    } else if (sender.role === "service") {
      // Service → reply to latest user who messaged
      const latestMsg = await prisma.message.findFirst({
        where: { receiverId: senderId },
        orderBy: { id: "desc" },
      });

      if (!latestMsg) {
        console.warn("No recent user message to reply to");
        return;
      }

      receiver = await prisma.user.findUnique({ where: { id: latestMsg.senderId } });
    }

    if (!receiver) {
      console.warn("Receiver not found");
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

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
