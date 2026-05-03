/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `password` VARCHAR(191) NOT NULL,
    MODIFY `phone` VARCHAR(191) NOT NULL,
    MODIFY `address` VARCHAR(191) NOT NULL;
