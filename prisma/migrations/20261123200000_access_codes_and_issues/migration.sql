-- CreateEnum
CREATE TYPE "IssueKind" AS ENUM ('STRIKE', 'EQUIPMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'RESOLVED');

-- DropForeignKey
ALTER TABLE "ChairReport" DROP CONSTRAINT "ChairReport_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "ScoreEvent" DROP CONSTRAINT "ScoreEvent_createdById_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_committeeId_fkey";

-- AlterTable
ALTER TABLE "ChairReport" DROP COLUMN "uploadedById",
ADD COLUMN     "uploadedBy" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Committee" ADD COLUMN     "chairCode" TEXT;

-- AlterTable
ALTER TABLE "ScoreEvent" DROP COLUMN "createdById";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "kind" "IssueKind" NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "committeeId" TEXT,
    "delegationId" TEXT,
    "details" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL DEFAULT '',
    "resolution" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Issue_status_createdAt_idx" ON "Issue"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Issue_committeeId_idx" ON "Issue"("committeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Committee_chairCode_key" ON "Committee"("chairCode");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_delegationId_fkey" FOREIGN KEY ("delegationId") REFERENCES "Delegation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

