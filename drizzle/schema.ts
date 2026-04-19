import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, tinyint, index, foreignKey } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm"

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull().primaryKey(),
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

export const customers = mysqlTable("customers", {
	id: int().autoincrement().notNull().primaryKey(),
	userId: int().notNull(),
	fullName: varchar({ length: 255 }).notNull(),
	address: text().notNull(),
	phone: varchar({ length: 20 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("customers_userId_unique").on(table.userId),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
	}),
]);

export const orders = mysqlTable("orders", {
	id: int().autoincrement().notNull().primaryKey(),
	customerId: int().notNull(),
	deliveryType: mysqlEnum(['pickup','delivery','self']).notNull(),
	bagCount: int().notNull(),
	paymentMethod: mysqlEnum(['cash','credit_card','line_pay','points']).notNull(),
	paymentStatus: mysqlEnum(['unpaid','paid']).default('unpaid').notNull(),
	notes: text(),
	orderStatus: mysqlEnum(['pending','scheduled','completed','cancelled']).default('pending').notNull(),
	estimatedCompletion: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	foreignKey({
		columns: [table.customerId],
		foreignColumns: [customers.id],
	}),
]);

export const schedules = mysqlTable("schedules", {
	id: int().autoincrement().notNull().primaryKey(),
	orderId: int().notNull(),
	scheduledDate: timestamp({ mode: 'string' }).notNull(),
	deliveryTime: varchar({ length: 10 }),
	isCompleted: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	foreignKey({
		columns: [table.orderId],
		foreignColumns: [orders.id],
	}),
]);
