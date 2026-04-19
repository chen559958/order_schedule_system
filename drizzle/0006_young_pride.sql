ALTER TABLE `customers` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `orders` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `schedules` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `users` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `orders` ADD `estimatedCompletion` timestamp;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `customers_userId_unique` ON `customers` (`userId`);--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `estimatedCompletionDate`;