import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getOrderItems,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
  deleteOrderItemsByOrderId,
  getDb,
} from "./db";

describe("OrderItems Database Functions", () => {
  let testOrderId: number;

  beforeAll(async () => {
    // 準備測試數據 - 直接在資料庫中創建訂單
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // 使用 SQL 直接插入測試訂單
    const result = await db.execute(`
      INSERT INTO orders (
        customerId, 
        deliveryType, 
        bagCount, 
        paymentMethod, 
        notes, 
        paymentStatus, 
        orderStatus, 
        orderNumber,
        progress,
        createdAt, 
        updatedAt
      ) VALUES (
        1,
        'pickup',
        3,
        'cash',
        'Test order for orderItems',
        'unpaid',
        'pending',
        'TEST-OI-001',
        'pending',
        NOW(),
        NOW()
      )
    `);

    testOrderId = (result[0] as any)?.insertId || 0;
    
    if (testOrderId === 0) {
      throw new Error("Failed to create test order");
    }
  });

  it("should create an order item", async () => {
    const result = await createOrderItem(
      testOrderId,
      "260421-01-01",
      "Test item notes"
    );
    expect(result).toBeDefined();
  });

  it("should get order items by order id", async () => {
    // 創建兩個項目
    await createOrderItem(testOrderId, "260421-01-02", "Item 2");
    await createOrderItem(testOrderId, "260421-01-03", "Item 3");

    const items = await getOrderItems(testOrderId);
    expect(items).toBeDefined();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(3);

    // 驗證項目存在
    const item1 = items.find((i: any) => i.itemNumber === "260421-01-01");
    expect(item1).toBeDefined();
  });

  it("should update an order item", async () => {
    const items = await getOrderItems(testOrderId);
    const itemToUpdate = items[0];
    
    if (!itemToUpdate) {
      throw new Error("No items to update");
    }

    await updateOrderItem(itemToUpdate.id, "Updated notes");

    const updatedItems = await getOrderItems(testOrderId);
    const updated = updatedItems.find((i: any) => i.id === itemToUpdate.id);
    expect(updated?.notes).toBe("Updated notes");
  });

  it("should delete an order item", async () => {
    const itemsBefore = await getOrderItems(testOrderId);
    const countBefore = itemsBefore.length;
    const itemToDelete = itemsBefore[0];

    if (!itemToDelete) {
      throw new Error("No items to delete");
    }

    await deleteOrderItem(itemToDelete.id);

    const itemsAfter = await getOrderItems(testOrderId);
    const countAfter = itemsAfter.length;

    expect(countAfter).toBe(countBefore - 1);
    expect(itemsAfter.find((i: any) => i.id === itemToDelete.id)).toBeUndefined();
  });

  it("should delete all order items by order id", async () => {
    // 創建新的測試訂單
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const result = await db.execute(`
      INSERT INTO orders (
        customerId, 
        deliveryType, 
        bagCount, 
        paymentMethod, 
        notes, 
        paymentStatus, 
        orderStatus, 
        orderNumber,
        progress,
        createdAt, 
        updatedAt
      ) VALUES (
        1,
        'delivery',
        2,
        'credit_card',
        'Test order 2 for orderItems',
        'unpaid',
        'pending',
        'TEST-OI-002',
        'pending',
        NOW(),
        NOW()
      )
    `);

    const newOrderId = (result[0] as any)?.insertId || 0;
    if (newOrderId === 0) {
      throw new Error("Failed to create test order 2");
    }

    // 添加多個項目
    await createOrderItem(newOrderId, "260421-02-01", "Item A");
    await createOrderItem(newOrderId, "260421-02-02", "Item B");
    await createOrderItem(newOrderId, "260421-02-03", "Item C");

    const itemsBefore = await getOrderItems(newOrderId);
    expect(itemsBefore.length).toBeGreaterThanOrEqual(3);

    // 刪除所有項目
    await deleteOrderItemsByOrderId(newOrderId);

    const itemsAfter = await getOrderItems(newOrderId);
    expect(itemsAfter.length).toBe(0);
  });

  it("should handle empty order items gracefully", async () => {
    // 創建一個新訂單但不添加項目
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const result = await db.execute(`
      INSERT INTO orders (
        customerId, 
        deliveryType, 
        bagCount, 
        paymentMethod, 
        notes, 
        paymentStatus, 
        orderStatus, 
        orderNumber,
        progress,
        createdAt, 
        updatedAt
      ) VALUES (
        1,
        'self',
        1,
        'line_pay',
        'Empty order for orderItems',
        'unpaid',
        'pending',
        'TEST-OI-003',
        'pending',
        NOW(),
        NOW()
      )
    `);

    const emptyOrderId = (result[0] as any)?.insertId || 0;
    if (emptyOrderId === 0) {
      throw new Error("Failed to create test order 3");
    }

    const items = await getOrderItems(emptyOrderId);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(0);
  });

  afterAll(async () => {
    // 清理測試數據
    if (testOrderId) {
      await deleteOrderItemsByOrderId(testOrderId);
      
      // 刪除測試訂單
      const db = await getDb();
      if (db) {
        // 使用簡單的 SQL 刪除
        try {
          await db.execute(`DELETE FROM orders WHERE orderNumber LIKE 'TEST-OI-%'`);
        } catch (e) {
          console.warn("Cleanup failed:", e);
        }
      }
    }
  });
});
