/*
  Warnings:

  - The values [NEW,IN_PROGRESS,CLOSED] on the enum `FollowUp_stage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `followup` MODIFY `stage` ENUM('INQUIRY', 'NEGOTIATION', 'FINALIZED') NOT NULL;
