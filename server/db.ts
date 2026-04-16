import { eq, and, gte, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, customers, orders, schedules, InsertCustomer, InsertOrder, InsertSchedule } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Customer queries
export async function getCustomerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertCustomer(userId: number, data: Omit<InsertCustomer, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getCustomerByUserId(userId);
  if (existing) {
    await db.update(customers).set(data).where(eq(customers.userId, userId));
  } else {
    await db.insert(customers).values({ ...data, userId });
  }
}

// Order queries
export async function createOrder(data: InsertOrder): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(data);
  return (result as any).insertId || 0;
}

export async function getOrdersByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.customerId, customerId));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders);
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Schedule queries
export async function createSchedule(data: InsertSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(schedules).values(data);
  return result;
}

export async function getSchedulesByDate(date: Date) {
  const db = await getDb();
  if (!db) return [];
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return await db.select().from(schedules).where(
    and(
      gte(schedules.scheduledDate, startOfDay),
      lt(schedules.scheduledDate, endOfDay)
    )
  );
}

export async function updateScheduleDeliveryTime(scheduleId: number, deliveryTime: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schedules).set({ deliveryTime }).where(eq(schedules.id, scheduleId));
}

export async function markScheduleAsCompleted(scheduleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schedules).set({ isCompleted: true }).where(eq(schedules.id, scheduleId));
}

export async function getScheduleByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schedules).where(eq(schedules.orderId, orderId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Admin queries - Customer management
export async function getAllCustomers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(customers);
}

// Admin queries - Order statistics
export async function getOrdersByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(
    and(
      gte(orders.createdAt, startDate),
      lt(orders.createdAt, endDate)
    )
  );
}

// Admin queries - Get orders with customer details
export async function getOrdersWithCustomers() {
  const db = await getDb();
  if (!db) return [];
  const allOrders = await db.select().from(orders);
  const enriched = await Promise.all(
    allOrders.map(async (order) => {
      const customer = await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1);
      return {
        ...order,
        customer: customer.length > 0 ? customer[0] : null,
      };
    })
  );
  return enriched;
}

// Admin queries - Get schedules with full details
export async function getSchedulesWithDetails(date: Date) {
  const db = await getDb();
  if (!db) return [];
  const scheduleList = await getSchedulesByDate(date);
  const enriched = await Promise.all(
    scheduleList.map(async (schedule) => {
      const order = await getOrderById(schedule.orderId);
      const customer = order ? await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1) : null;
      return {
        ...schedule,
        order: order,
        customer: customer && customer.length > 0 ? customer[0] : null,
      };
    })
  );
  return enriched;
}
