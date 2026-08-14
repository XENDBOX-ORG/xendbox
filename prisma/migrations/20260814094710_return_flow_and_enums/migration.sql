-- CreateEnum
CREATE TYPE "DispatchType" AS ENUM ('DELIVERY', 'RETURN');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'RETURNED';

-- AlterTable
ALTER TABLE "dispatches" ADD COLUMN     "type" "DispatchType" NOT NULL DEFAULT 'DELIVERY';
