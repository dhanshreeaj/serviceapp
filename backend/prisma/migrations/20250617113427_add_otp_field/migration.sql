/*
  Warnings:

  - You are about to drop the column `code` on the `Verification` table. All the data in the column will be lost.
  - Added the required column `otp` to the `Verification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Verification" DROP COLUMN "code",
ADD COLUMN     "otp" TEXT NOT NULL;
