import { eq, and, gte, lt, lte, asc, sql } from "drizzle-orm";
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

export async function upsertCustomer(userId: number, data: Omit<InsertCustomer, 'userId'>): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getCustomerByUserId(userId);
  if (existing) {
    await db.update(customers).set(data).where(eq(customers.userId, userId));
    return existing.id;
  } else {
    const result = await db.insert(customers).values({ ...data, userId });
    const insertId = (result as any).insertId || 0;
    if (insertId === 0) {
      // 如果 insertId 為 0，重新查詢以獲取正確的 ID
      const newCustomer = await getCustomerByUserId(userId);
      if (newCustomer) return newCustomer.id;
      throw new Error("Failed to get customer ID after insert");
    }
    return insertId;
  }
}

// Order queries
export async function createOrder(data: InsertOrder): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 生成當天遞增編號 (YYMMDD-序號)
  const today = new Date();
  const year = String(today.getFullYear()).slice(-2);
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${date}`; // YYMMDD
  
  // 查詢今天已有的訂單數 - 使用正確的 Drizzle 查詢方式
  let count = 0;
  try {
    const result = await db.select({ count: sql`COUNT(*) as count` }).from(orders).where(
      sql`DATE(${orders.createdAt}) = CURDATE()`
    );
    count = parseInt((result[0] as any)?.count || '0', 10);
  } catch (error) {
    console.warn('[Database] Failed to count today orders, using 0:', error);
    count = 0;
  }
  
  const orderNumber = `${dateStr}-${String(count + 1).padStart(2, '0')}`;
  
  // 添加訂單編號到數據
  const orderData = { ...data, orderNumber };
  console.log('[Database] Creating order with number:', orderNumber);
  const result = await db.insert(orders).values(orderData);
  const insertId = (result as any).insertId || 0;
  console.log('[Database] Order created with ID:', insertId, 'Order Number:', orderNumber);
  return insertId;
}

export async function getOrdersByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: orders.id,
      customerId: orders.customerId,
      deliveryType: orders.deliveryType,
      bagCount: orders.bagCount,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      notes: orders.notes,
      orderStatus: orders.orderStatus,
      orderNumber: orders.orderNumber,
      progress: orders.progress,
      estimatedCompletion: orders.estimatedCompletion,
      completedAt: orders.completedAt,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      customerName: customers.fullName,
      customerPhone: customers.phone,
      customerAddress: customers.address,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.customerId, customerId))
    .orderBy(asc(orders.createdAt));
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: orders.id,
      customerId: orders.customerId,
      deliveryType: orders.deliveryType,
      bagCount: orders.bagCount,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      notes: orders.notes,
      orderStatus: orders.orderStatus,
      orderNumber: orders.orderNumber,
      progress: orders.progress,
      estimatedCompletion: orders.estimatedCompletion,
      completedAt: orders.completedAt,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      customerName: users.name,
      customerPhone: customers.phone,
      customerAddress: customers.address,
    })
    .from(orders)
    .leftJoin(users, eq(orders.customerId, users.id))
    .leftJoin(customers, eq(users.id, customers.userId))
    .where(eq(orders.customerId, userId))
    .orderBy(asc(orders.createdAt));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  // 使用 leftJoin 來獲取客戶信息
  return await db
    .select({
      id: orders.id,
      customerId: orders.customerId,
      deliveryType: orders.deliveryType,
      bagCount: orders.bagCount,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      notes: orders.notes,
      orderStatus: orders.orderStatus,
      orderNumber: orders.orderNumber,
      progress: orders.progress,
      estimatedCompletion: orders.estimatedCompletion,
      completedAt: orders.completedAt,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      customerName: customers.fullName,
      customerPhone: customers.phone,
      customerAddress: customers.address,
    })
    .from(orders)
    .leftJoin(users, eq(orders.customerId, users.id))
    .leftJoin(customers, eq(users.id, customers.userId))
    .orderBy(asc(orders.createdAt));
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
  
  return await db
    .select({
      id: schedules.id,
      orderId: schedules.orderId,
      scheduledDate: schedules.scheduledDate,
      deliveryTime: schedules.deliveryTime,
      isCompleted: schedules.isCompleted,
      createdAt: schedules.createdAt,
      updatedAt: schedules.updatedAt,
      customerName: customers.fullName,
      customerPhone: customers.phone,
      customerAddress: customers.address,
      deliveryType: orders.deliveryType,
      bagCount: orders.bagCount,
    })
    .from(schedules)
    .leftJoin(orders, eq(schedules.orderId, orders.id))
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(
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
  await db.update(schedules).set({ isCompleted: true, completedAt: new Date() }).where(eq(schedules.id, scheduleId));
}

export async function completeOrder(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  await db.update(orders).set({ orderStatus: 'completed', completedAt: now }).where(eq(orders.id, orderId));
}

export async function getScheduleByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schedules).where(eq(schedules.orderId, orderId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateScheduleDate(orderId: number, newDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schedules).set({ scheduledDate: newDate }).where(eq(schedules.orderId, orderId));
}

// Get all schedules (for loading order dates)
export async function getAllSchedules() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(schedules);
}

// Get orders by date (for admin order overview)
export async function getOrdersByDate(date: Date) {
  const db = await getDb();
  if (!db) return [];
  
  // Format date as YYYY-MM-DD for string comparison
  const dateStr = date.toISOString().split('T')[0];
  const startOfDay = `${dateStr} 00:00:00`;
  const endOfDay = `${dateStr} 23:59:59`;
  
  return await db
    .select({
      id: orders.id,
      customerId: orders.customerId,
      deliveryType: orders.deliveryType,
      bagCount: orders.bagCount,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      notes: orders.notes,
      orderStatus: orders.orderStatus,
      estimatedCompletion: orders.estimatedCompletion,
      completedAt: orders.completedAt,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      customerName: customers.fullName,
      customerPhone: customers.phone,
      customerAddress: customers.address,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(
      and(
        gte(orders.createdAt, startOfDay),
        lte(orders.createdAt, endOfDay)
      )
    );
}

// Get all customers for admin customer page
export async function getAllCustomers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(customers);
}

// Get customer order history
export async function getCustomerOrderHistory(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(orders.createdAt);
}


export async function updateCustomer(customerId: number, data: Partial<Omit<InsertCustomer, 'userId'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customers).set(data).where(eq(customers.id, customerId));
}


// OrderItems 相關函數
export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) {
    console.error('[ERROR] Database connection failed');
    return [];
  }
  
  console.log('[DEBUG] getOrderItems called with orderId:', orderId);
  
  try {
    const result = await db.execute(
      `SELECT id, orderId, itemNumber, notes, photoUrl FROM orderItems WHERE orderId = ? ORDER BY id`,
      [orderId]
    );
    console.log('[DEBUG] Query result count:', (result as any[]).length);
    return result as any[];
  } catch (error: any) {
    console.error('[ERROR] getOrderItems query failed:', error.message);
    throw error;
  }
}

export async function createOrderItem(orderId: number, itemNumber: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { orderItems } = await import("../drizzle/schema");
  const result = await db.insert(orderItems).values({
    orderId,
    itemNumber,
    notes: notes && notes.length > 0 ? notes : null,
    photoUrl: null,
  });
  
  return result;
}

export async function updateOrderItem(itemId: number, notes?: string, photoUrl?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { orderItems } = await import("../drizzle/schema");
  const updateData: any = {};
  if (notes !== undefined) updateData.notes = notes || null;
  if (photoUrl !== undefined) updateData.photoUrl = photoUrl || null;
  
  await db.update(orderItems).set(updateData).where(eq(orderItems.id, itemId));
}

export async function deleteOrderItem(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { orderItems } = await import("../drizzle/schema");
  await db.delete(orderItems).where(eq(orderItems.id, itemId));
}

export async function deleteOrderItemsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { orderItems } = await import("../drizzle/schema");
  await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
}
