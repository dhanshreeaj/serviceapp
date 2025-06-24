-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
INSERT INTO "Service" (id, title, image) VALUES
  (1, 'Women Salon', '/images/wspa.png'),
  (2, 'Men Salon', '/images/mens.png'),
  (3, 'AC & Appliance Repair', '/images/ac.png'),
  (4, 'Cleaning & Pest Control', '/images/clean.png'),
  (5, 'Electrician', '/images/elct.png'),
  (6, 'Walls & rooms paints', '/images/paint.png');
