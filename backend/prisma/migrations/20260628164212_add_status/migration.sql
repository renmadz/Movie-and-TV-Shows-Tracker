-- CreateEnum
CREATE TYPE "Status" AS ENUM ('WATCHING', 'WATCHED', 'PLAN_TO_WATCH', 'DROPPED');

-- AlterTable
ALTER TABLE "Entry" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'WATCHED';
