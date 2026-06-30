-- CreateTable
CREATE TABLE "Rewatch" (
    "id" SERIAL NOT NULL,
    "entryId" INTEGER NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rewatch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Rewatch" ADD CONSTRAINT "Rewatch_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
