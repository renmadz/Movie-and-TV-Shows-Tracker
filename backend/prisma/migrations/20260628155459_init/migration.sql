-- CreateEnum
CREATE TYPE "Type" AS ENUM ('MOVIE', 'TV_SHOW');

-- CreateTable
CREATE TABLE "Entry" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" "Type" NOT NULL,
    "rating" DOUBLE PRECISION,
    "genre" TEXT,
    "notes" TEXT,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);
