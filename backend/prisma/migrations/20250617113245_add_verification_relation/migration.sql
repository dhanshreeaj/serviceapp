/*
  Warnings:

  - You are about to drop the column `otp` on the `Verification` table. All the data in the column will be lost.
  - Added the required column `code` to the `Verification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Verification" DROP COLUMN "otp",
ADD COLUMN     "code" TEXT NOT NULL;
