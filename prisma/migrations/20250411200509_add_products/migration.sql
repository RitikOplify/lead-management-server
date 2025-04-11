/*
  Warnings:

  - You are about to alter the column `status` on the `followup` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(4))`.
  - You are about to alter the column `stage` on the `followup` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(4))`.

*/
-- DropForeignKey
ALTER TABLE `dealer` DROP FOREIGN KEY `Dealer_companyId_fkey`;

-- AlterTable
ALTER TABLE `followup` MODIFY `status` ENUM('NEW', 'IN_PROGRESS', 'CLOSED') NOT NULL,
    MODIFY `stage` ENUM('NEW', 'IN_PROGRESS', 'CLOSED') NOT NULL;

-- AlterTable
ALTER TABLE `lead` ADD COLUMN `companyName` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Dealer` ADD CONSTRAINT `Dealer_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
