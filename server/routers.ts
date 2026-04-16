import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getCustomerByUserId,
  upsertCustomer,
  createOrder,
  getOrdersByCustomerId,
  getAllOrders,
  getOrderById,
  createSchedule,
  getSchedulesByDate,
  updateScheduleDeliveryTime,
  markScheduleAsCompleted,
  getScheduleByOrderId,
  getAllCustomers,
  getOrdersByDateRange,
  getOrdersWithCustomers,
  getSchedulesWithDetails,
} from "./db";
import { TRPCError } from "@trpc/server";

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
        const customer = await getCustomerByUserId(ctx.user.id);
        if (!customer) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Customer profile not found",
          });
        }

        const orderId = await createOrder({
          customerId: customer.id,
          deliveryType: input.deliveryType,
          bagCount: input.bagCount,
          paymentMethod: input.paymentMethod,
          notes: input.notes || null,
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
      const customer = await getCustomerByUserId(ctx.user.id);
      if (!customer) return [];
      return await getOrdersByCustomerId(customer.id);
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

    getTodaySchedulesWithDetails: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "user") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Buyers cannot view schedules",
        });
      }
      return await getSchedulesWithDetails(new Date());
    }),
  }),

  // Admin procedures
  admin: router({
    getAllCustomers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view all customers",
        });
      }
      return await getAllCustomers();
    }),

    getOrdersByDateRange: protectedProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can view order statistics",
          });
        }
        return await getOrdersByDateRange(input.startDate, input.endDate);
      }),

    getOrdersWithCustomers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view orders with customer details",
        });
      }
      return await getOrdersWithCustomers();
    }),
  }),
});

export type AppRouter = typeof appRouter;
