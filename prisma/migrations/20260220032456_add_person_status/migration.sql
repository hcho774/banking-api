-- CreateEnum
CREATE TYPE "PersonStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- AlterTable
ALTER TABLE "person" ADD COLUMN     "status" "PersonStatus" NOT NULL DEFAULT 'ACTIVE';
