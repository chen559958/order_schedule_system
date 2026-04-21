import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getCustomerByUserId,
  upsertCustomer,
  createOrder,
  getOrdersByCustomerId,
  getOrdersByUserId,
  getAllOrders,
  getOrderById,
  createSchedule,
  getSchedulesByDate,
  updateScheduleDeliveryTime,
  markScheduleAsCompleted,
  completeOrder,
  getScheduleByOrderId,
  updateScheduleDate,
  getDb,
  getOrdersByDate,
  getAllCustomers,
  getCustomerOrderHistory,
  getAllSchedules,
  getOrderItems,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
  deleteOrderItemsByOrderId,
} from "./db";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { users, orders } from "../drizzle/schema";
import { eq, and, gte, lt } from "drizzle-orm";

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const hashedPassword = hashPassword(input.password);
        
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }
        
        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);
        
        if (result.length === 0 || result[0].password !== hashedPassword) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: '帳號或密碼錯誤',
          });
        }
        
        return {
          id: result[0].id,
          email: result[0].email,
          name: result[0].name,
          role: result[0].role,
          token: 'token_' + result[0].id,
        };
      }),
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          fullName: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const hashedPassword = hashPassword(input.password);
        
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }
        
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);
        
        if (existingUser.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '該 Email 已被註冊',
          });
        }
        
        await db.insert(users).values({
          email: input.email,
          password: hashedPassword,
          name: input.fullName,
          role: 'user',
          loginMethod: 'email',
          openId: 'user_' + Date.now(),
        });
        
        return {
          success: true,
          message: '註冊成功，請登入',
        };
      }),
  }),

  // Customer procedures
  customer: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await getCustomerByUserId(ctx.user.id);
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          fullName: z.string().min(1),
          address: z.string().min(1),
          phone: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await upsertCustomer(ctx.user.id, {
          fullName: input.fullName,
          address: input.address,
          phone: input.phone,
        });
        return { success: true };
      }),
  }),

  // Order procedures
  order: router({
    create: protectedProcedure
      .input(
        z.object({
          deliveryType: z.enum(["pickup", "delivery", "self"]),
          bagCount: z.number().int().positive(),
          paymentMethod: z.enum(["cash", "credit_card", "line_pay", "points"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // 確保 customer 記錄存在（用於存儲客戶信息）
        const existing = await getCustomerByUserId(ctx.user.id);
        if (!existing) {
          // 自動為用戶創建 customer 記錄
          await upsertCustomer(ctx.user.id, {
            fullName: ctx.user.name || "User",
            phone: "",
            address: "",
          });
        }

        // 直接使用 userId 作為 customerId（因為外鍵指向 users.id）
        const orderId = await createOrder({
          customerId: ctx.user.id,
          deliveryType: input.deliveryType,
          bagCount: input.bagCount,
          paymentMethod: input.paymentMethod,
          notes: input.notes || "",
          paymentStatus: "unpaid",
          orderStatus: "pending",
        });

        // Create schedule for the order
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await createSchedule({
          orderId: orderId,
          scheduledDate: today,
          deliveryTime: null,
          isCompleted: false,
        });

        return { success: true, orderId: orderId };
      }),

    getMyOrders: protectedProcedure.query(async ({ ctx }) => {
      return await getOrdersByUserId(ctx.user.id);
    }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view all orders",
        });
      }
      return await getAllOrders();
    }),

    getById: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await getOrderById(input.orderId);
      }),

    getByDate: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can view orders by date",
          });
        }
        const date = new Date(input.date);
        return await getOrdersByDate(date);
      }),

    getPending: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view pending orders",
        });
      }
      const db = await getDb();
      if (!db) return [];
      
      const { orders: ordersTable } = await import("../drizzle/schema");
      const result = await db.execute(`
        SELECT 
          o.id,
          o.customerId,
          o.deliveryType,
          o.bagCount,
          o.paymentMethod,
          o.paymentStatus,
          o.notes,
          o.orderStatus,
          o.orderNumber,
          o.progress,
          o.estimatedCompletion,
          o.completedAt,
          o.createdAt,
          o.updatedAt,
          u.name as customerName,
          u.email as customerEmail
        FROM orders o
        LEFT JOIN users u ON o.customerId = u.id
        WHERE o.orderStatus = 'pending'
        ORDER BY o.createdAt DESC
      `);
      return (result[0] as any[]) || [];
    }),

    updateProgress: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        progress: z.enum(['pending', 'received', 'washing', 'returning', 'completed']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can update order progress',
          });
        }
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // 使用 Drizzle query builder 更新訂單進度
        // 不手動設定 updatedAt，讓資料庫自動更新
        const { orders: ordersTable } = await import("../drizzle/schema");
        await db.update(ordersTable).set({
          progress: input.progress,
        }).where(eq(ordersTable.id, input.orderId));
        
        return { success: true };
      }),
  }),

  // Schedule procedures
  schedule: router({
    getTodaySchedules: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "user") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Buyers cannot view schedules",
        });
      }
      return await getSchedulesByDate(new Date());
    }),

    updateDeliveryTime: protectedProcedure
      .input(
        z.object({
          scheduleId: z.number(),
          deliveryTime: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can update delivery time",
          });
        }
        await updateScheduleDeliveryTime(input.scheduleId, input.deliveryTime);
        return { success: true };
      }),

    markCompleted: protectedProcedure
      .input(z.object({ scheduleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can mark schedules as completed",
          });
        }
        await markScheduleAsCompleted(input.scheduleId);
        return { success: true };
      }),

    getByOrderId: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await getScheduleByOrderId(input.orderId);
      }),

    completeOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can complete orders",
          });
        }
        await completeOrder(input.orderId);
        return { success: true };
      }),

    updateScheduleDate: protectedProcedure
      .input(z.object({ orderId: z.number(), newDate: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can update schedule dates",
          });
        }
        const newDate = new Date(input.newDate);
        newDate.setHours(0, 0, 0, 0);
        await updateScheduleDate(input.orderId, newDate);
        return { success: true };
      }),

    getAllSchedules: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view all schedules",
        });
      }
      return await getAllSchedules();
    }),
  }),

  // OrderItems procedures
  orderItem: router({
    getByOrderId: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await getOrderItems(input.orderId);
      }),

    create: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        itemNumber: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found',
          });
        }
        
        if (ctx.user.role !== 'admin' && order.customerId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to add items to this order',
          });
        }
        
        await createOrderItem(input.orderId, input.itemNumber, input.notes);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        itemId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateOrderItem(input.itemId, input.notes);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteOrderItem(input.itemId);
        return { success: true };
      }),

    deleteByOrderId: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can delete all items for an order',
          });
        }
        await deleteOrderItemsByOrderId(input.orderId);
        return { success: true };
      }),
  }),

  // Admin customer procedures
  adminCustomer: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view all customers",
        });
      }
      return await getAllCustomers();
    }),

    getOrderHistory: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can view customer order history",
          });
        }
        return await getCustomerOrderHistory(input.customerId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
