/*
  Warnings:

  - Made the column `idempotencyKey` on table `transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "idempotencyKey" SET NOT NULL;
