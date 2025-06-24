import { Router, Response } from "express";
import { PrismaClient} from "@prisma/client";
import { Prisma } from "@prisma/client";

import authenticationToken from "../middleware/authen"; 
import authenticate, { AuthenticatedRequest } from "../middleware/authen";
import crypto from "crypto";
import { error } from "console";

const prisma = new PrismaClient();
const router = Router();

// GET /api/bookings
router.get("/", authenticate as any, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user?.role !== "service") {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  prisma.booking.findMany({
    include: { service: true },
    orderBy: { createdAt: "desc" },
  })
  .then((bookings: any) => {
    res.json(bookings);
  })
  .catch((err: Error) => {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ error: "Error fetching bookings" });
  });
});

// PATCH /api/bookings/:id
router.patch("/:id", authenticate as any, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { status } = req.body;

  prisma.booking.update({
    where: { id: Number(id) },
    data: { status },
  })
  .then((updated: any) => {
    res.json(updated);
  })
  .catch((err: Error) => {
    console.error("Error updating status:", err);
    res.status(500).json({ error: "Error updating status" });
  });
});

// 📁 src/routes/bookings.ts
router.get("/user/:userId", authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.params.userId);

  prisma.booking
    .findMany({
      where: { userId },
      include: { service: true },
      orderBy: { createdAt: "desc" },
    })
    .then((bookings: any) => res.json(bookings))
    .catch((err: any) => {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch user bookings" });
    });
});

router.patch("/:id", authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, otp } = req.body;

  prisma.booking.findUnique({ where: { id: Number(id) } })
    .then((booking:any) => {
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // If status is "accepted", generate and save OTP
      if (status === "accepted") {
        const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
        return prisma.booking.update({
          where: { id: Number(id) },
          data: { status, otp: generatedOTP },
        }).then((updated: any) => res.json({ ...updated, showOtp: true }));
      }

      // If status is "completed", validate OTP
      if (status === "completed") {
        if (otp !== booking.otp) {
          return res.status(400).json({ error: "Invalid OTP" });
        }

        return prisma.booking.update({
          where: { id: Number(id) },
          data: { status, otp: null },
        }).then((updated: any) => res.json(updated));
      }

      // Default status update
      return prisma.booking.update({
        where: { id: Number(id) },
        data: { status },
      }).then((updated: any) => res.json(updated));
    })
    .catch((err: unknown) => {
      console.error("Error updating booking:", err);
      res.status(500).json({ error: "Error updating booking" });
    });
});

// PATCH /api/bookings/:id/otp - regenerate OTP
router.patch("/:id/otp", authenticate, (req: AuthenticatedRequest, res: Response) => {
  const bookingId = Number(req.params.id);

  prisma.booking.findUnique({ where: { id: bookingId } })
    .then((booking:any) => {
      if (!booking) {
        res.status(404).json({ error: "Booking not found" });
        return null;
      }

      if (booking.status !== "accepted") {
        res.status(400).json({ error: "Booking must be in accepted status to generate OTP" });
        return null;
      }

      const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
      return prisma.booking.update({
        where: { id: bookingId },
        data: { otp: newOTP },
      });
    })
    .then((updated:any) => {
      if (updated) {
        res.json({ otp: updated.otp });
      }
    })
    .catch((err: unknown) => {
      console.error(err);
      res.status(500).json({ error: "Failed to generate OTP" });
    });
});

router.post("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { userId, serviceId, category, date, time, address, description, price } = req.body;

  try {
    const booking = await prisma.booking.create({
      data: {
        userId: Number(userId),
        serviceId: Number(serviceId),
        category,
        date,
        time,
        address,
        price: Number(price),
        status: "pending",
      },
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

router.patch("/:id/mark-paid",authenticationToken,async(req,res)=>{
  const bookingId=parseInt(req.params.id);
  try{
    const updated=await prisma.booking.update({
      where:{id:bookingId},
      data:{status:"done"},
    });
    res.json(updated);
  } catch (err) {
    console.error("Failed to mark booking as paid:", err);
    res.status(500).json({ error: "Failed to update booking status" });
  }
});

router.get("/latest", authenticationToken, async (req, res) => {
  const userId = (req as any).user.id;

  try {
    const latestBooking = await prisma.booking.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { service: true },
    });

    if (!latestBooking) {
       res.status(404).json({ error: "No booking found" });
       return;
    }

    res.json(latestBooking);
  } catch (err) {
    console.error("Error fetching latest booking:", err);
    res.status(500).json({ error: "Server error" });
  }
});


export default router;
