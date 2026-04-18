ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255) NULL;