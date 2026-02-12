-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PROCESSING',
    "name" TEXT,
    "description" TEXT,
    "ingredients" JSONB,
    "instructions" JSONB,
    "prepTime" INTEGER,
    "cookTime" INTEGER,
    "servings" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);
