-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UomType" AS ENUM ('MIN', 'MAX', 'TIMELINE', 'ZERO');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'RETURNED');

-- CreateEnum
CREATE TYPE "EmbeddingSource" AS ENUM ('GOAL', 'AUDIT', 'SUMMARY');

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "lockDate" TIMESTAMP(3) NOT NULL,
    "checkinWindowOpen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInWindow" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckInWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thrustArea" TEXT NOT NULL,
    "uomType" "UomType" NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "weightage" DOUBLE PRECISION NOT NULL,
    "actual" DOUBLE PRECISION,
    "progressScore" DOUBLE PRECISION,
    "status" "GoalStatus" NOT NULL DEFAULT 'DRAFT',
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "returnComment" TEXT,
    "unlockReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalAssignment" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "weightage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInComment" (
    "id" TEXT NOT NULL,
    "windowId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckInComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "sourceType" "EmbeddingSource" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "cycleId" TEXT,
    "content" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GoalAssignment_goalId_subscriberId_key" ON "GoalAssignment"("goalId", "subscriberId");

-- CreateIndex
CREATE INDEX "Embedding_cycleId_idx" ON "Embedding"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_sourceType_sourceId_key" ON "Embedding"("sourceType", "sourceId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInWindow" ADD CONSTRAINT "CheckInWindow_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAssignment" ADD CONSTRAINT "GoalAssignment_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAssignment" ADD CONSTRAINT "GoalAssignment_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInComment" ADD CONSTRAINT "CheckInComment_windowId_fkey" FOREIGN KEY ("windowId") REFERENCES "CheckInWindow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
