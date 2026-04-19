import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, tinyint, index } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm"

export const customers = mysqlTable("customers", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	fullName: varchar({ length: 255 }).notNull(),
	address: text().notNull(),
	phone: varchar({ length: 20 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const orders = mysqlTable("orders", {
	id: int().autoincrement().notNull(),
	customerId: int().notNull(),
	deliveryType: mysqlEnum(['pickup','delivery','self']).notNull(),
	bagCount: int().notNull(),
	paymentMethod: mysqlEnum(['cash','credit_card','line_pay','points']).notNull(),
	paymentStatus: mysqlEnum(['unpaid','paid']).default('unpaid').notNull(),
	notes: text(),
	orderStatus: mysqlEnum(['pending','scheduled','completed','cancelled']).default('pending').notNull(),
	status: mysqlEnum(['pending','completed']).default('pending').notNull(),
	estimatedCompletionDate: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const schedules = mysqlTable("schedules", {
	id: int().autoincrement().notNull(),
	orderId: int().notNull(),
	scheduledDate: timestamp({ mode: 'string' }).notNull(),
	deliveryTime: varchar({ length: 10 }),
	isCompleted: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin','staff']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	password: varchar({ length: 255 }),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);
