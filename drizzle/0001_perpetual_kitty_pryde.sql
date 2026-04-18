CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`phone` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`deliveryType` enum('pickup','delivery','self') NOT NULL,
	`bagCount` int NOT NULL,
	`paymentMethod` enum('cash','credit_card','line_pay','points') NOT NULL,
	`paymentStatus` enum('unpaid','paid') NOT NULL DEFAULT 'unpaid',
	`notes` text,
	`orderStatus` enum('pending','scheduled','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`scheduledDate` timestamp NOT NULL,
	`deliveryTime` varchar(10),
	`isCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','staff') NOT NULL DEFAULT 'user';