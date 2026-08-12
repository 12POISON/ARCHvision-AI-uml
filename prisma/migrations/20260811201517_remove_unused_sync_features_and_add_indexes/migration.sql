/*
  Warnings:

  - You are about to drop the column `dbConnection` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `githubToken` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `SyncJob` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SyncJob" DROP CONSTRAINT "SyncJob_projectId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "dbConnection",
DROP COLUMN "githubToken";

-- DropTable
DROP TABLE "SyncJob";

-- DropEnum
DROP TYPE "JobStatus";

-- CreateIndex
CREATE INDEX "Diagram_projectId_idx" ON "Diagram"("projectId");

-- CreateIndex
CREATE INDEX "Export_diagramId_idx" ON "Export"("diagramId");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "PromptHistory_diagramId_idx" ON "PromptHistory"("diagramId");

-- CreateIndex
CREATE INDEX "ValidationReport_diagramId_idx" ON "ValidationReport"("diagramId");
