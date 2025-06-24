import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import authenticationToken from "../middleware/authen";
import { error } from "console";

const prisma = new PrismaClient();
const router = Router();

// router.post("/", authenticationToken, async (req, res) => {
//   const { rating, comment, bookingId } = req.body;
//   const userId = (req as any).user.id;

//   try {
//     const user = await prisma.user.findUnique({ where: { id: userId } });

//     const booking = await prisma.booking.findUnique({
//       where: { id: Number(bookingId) },
//       include: { service: true },
//     });

//     if (!booking || booking.userId !== userId) {
//       res.status(400).json({ error: "Invalid booking for feedback" });
//       return;
//     }

//     const feedback = await prisma.feedback.create({
//       data: {
//         userId,
//         bookingId: booking.id,
//         rating,
//         comment,
//         userName: user?.name || "Unknown",
//       },
//     });

//     res.json(feedback);
//   } catch (err) {
//     console.error("Feedback error:", err);
//     res.status(500).json({ error: "Failed to save feedback" });
//   }
// });

router.post("/", authenticationToken, async (req, res) => {
  const { rating, comment, bookingId } = req.body;
  const userId = (req as any).user.id;

  if (!bookingId || !rating || !comment) {
     res.status(400).json({ error: "Missing required fields" });
     return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true },
    });

    if (!booking) {
      res.status(400).json({ error: "Booking not found" });
      return ;
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        bookingId,
        rating,
        comment,
        userName: user?.name || "Unknown",
      },
    });

    res.json(feedback);
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

router.get("/", async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
  orderBy: { createdAt: "desc" },
  include: {
    booking: {
      include: {
        service: true,
      },
    },
  },
});

res.json(
  feedbacks.map((fb:any) => ({
    id: fb.id,
    userName: fb.userName,
    rating: fb.rating,
    comment: fb.comment,
    category: fb.booking?.category || "Unknown",
    serviceTitle: fb.booking?.service?.title || "Unknown",
  }))
);
}catch (err) {
    console.error("Error fetching feedbacks:", err);
    res.status(500).json({ error: "Failed to fetch feedbacks" });
  }
});
// GET /api/bookings/latest
router.get("/latest", authenticationToken, async (req, res) => {
  const userId = (req as any).user.id;
  const latestBooking = await prisma.booking.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { service: true },
  });
  if (!latestBooking)res.status(404).json({ error: "No booking found" });
  return;
  res.json(latestBooking);
});


export default router;
