/*
  Warnings:

  - You are about to drop the column `description` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "description",
ADD COLUMN     "otp" TEXT,
ALTER COLUMN "date" SET DATA TYPE TEXT,
ALTER COLUMN "status" DROP DEFAULT;
