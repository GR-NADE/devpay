/*
  Warnings:

  - You are about to drop the column `stripe_session_id` on the `invoices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "stripe_session_id",
ADD COLUMN     "paystack_reference" TEXT;
