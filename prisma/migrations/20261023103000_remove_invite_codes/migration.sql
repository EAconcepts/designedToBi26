-- DropIndex
DROP INDEX "Guest_code_key";

-- AlterTable
ALTER TABLE "Guest" DROP COLUMN "code",
DROP COLUMN "openedAt",
ADD COLUMN "ipHash" TEXT;

-- CreateIndex
CREATE INDEX "Guest_ipHash_idx" ON "Guest"("ipHash");
