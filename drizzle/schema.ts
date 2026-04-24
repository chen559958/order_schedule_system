import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, index, foreignKey, tinyint } from 'drizzle-orm/mysql-core';
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
	orderNumber: varchar({ length: 20 }),
	progress: mysqlEnum(['pending','received','washing','returning','completed']).default('pending').notNull(),
	estimatedCompletion: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	foreignKey({
		columns: [table.customerId],
		foreignColumns: [users.id],
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

export const orderItems = mysqlTable("orderItems", {
	id: int().autoincrement().notNull().primaryKey(),
	orderId: int().notNull(),
	itemNumber: varchar({ length: 50 }).notNull(), // 格式: 訂單編號-01, 訂單編號-02 等
	notes: text(), // 衣物備註
	photoUrl: text(), // S3 相片 URL
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	},
(table) => [
	foreignKey({
		columns: [table.orderId],
		foreignColumns: [orders.id],
	}),
]);