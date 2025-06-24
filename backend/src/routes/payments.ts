import express, { Request, Response } from "express";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import authenticationToken from "../middleware/authen"; // Assuming it's a default export
import bodyParser from "body-parser";
import { error } from "console"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});
const endpointSecret = process.env.KEY!;
const prisma = new PrismaClient();
const router = express.Router();

router.post("/create-checkout-session",
  authenticationToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { bookingId } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking || booking.status !== "completed")
 {
        res.status(400).json({ error: "Booking not completed or invalid." });
        return;
      }

     const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  line_items: [
    {
      price_data: {
        currency: "inr",
        product_data: {
          name: `Service: ${booking.category}`,
        },
        unit_amount: booking.price * 100,
      },
      quantity: 1,
    },
  ],
  mode: "payment",
  // metadata: {
  //   bookingId: booking.id.toString(), // 🔑 used in webhook
  // },
  success_url: `http://localhost:3000/success?bookingId=${booking.id}`,
  // cancel_url: "http://localhost:3000/cancel",
   
  // success_url: "http://localhost:3000/success",
  cancel_url: "http://localhost:3000/cancel",
  metadata: {
    bookingId: booking.id.toString(),// 🔑 used in webhook
  },
});
res.json({ id: session.id });

    } catch (error) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);

router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = "whsec_794df6fc5c8e00029112f29bc6e92a9ea134c705394e12bf1d1625ce24df38ed";

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    res.status(400).send(`Webhook Error: ${err}`);
    return;
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      try {
        console.log(` Webhook received for Booking ID: ${bookingId}`);

        const response = await axios.patch(`http://localhost:5000/api/bookings/${bookingId}/mark-paid`);

        console.log(`✅ Booking ${bookingId} marked as 'done' via internal API.`);
        console.log("📨 Webhook handled successfully.");
      } catch (err) {
        console.error(" Failed to update booking via internal API:", err);
      }
    } else {
      console.warn(" No bookingId found in session metadata.");
    }
  }

  // Respond to Stripe to acknowledge receipt of the event
  res.json({ received: true });
});
router.patch("/bookings/:id/mark-paid",authenticationToken,async(req,res)=>{
    const bookingId=parseInt(req.params.id);
    try{
        const updated=await prisma.booking.update({
            where: { id:bookingId},
            data:{status:"done"},
        });
        res.json(updated);
    }catch(err){
        console.error(err);
        res.status(500).json({error:"Failed to mark as paid"});
    }
});


export default router;
