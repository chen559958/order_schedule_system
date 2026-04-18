import { router, publicProcedure } from '../trpc.js';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ordersRouter = router({
  // 創建訂單
  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        bags: z.number(),
        amount: z.number(),
        deliveryMethod: z.string(),
        paymentMethod: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const order = await prisma.order.create({
        data: {
          userId: parseInt(input.userId),
          bags: input.bags,
          amount: input.amount,
          deliveryMethod: input.deliveryMethod,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
          orderDate: new Date(),
          status: 'pending',
        },
        include: { user: true },
      });
      return order;
    }),

  // 獲取用戶訂單列表
  listByUser: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        page: z.number().default(1),
        limit: z.number().default(10),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const where: any = { userId: input.userId };
      if (input.status) {
        where.status = input.status;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: { user: true, schedules: true },
          orderBy: { orderDate: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        prisma.order.count({ where }),
      ]);

      return { orders, total, page: input.page, limit: input.limit };
    }),

  // 獲取所有訂單
  listAll: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const where: any = {};
      if (input.status) {
        where.status = input.status;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: { user: true, schedules: true },
          orderBy: { orderDate: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        prisma.order.count({ where }),
      ]);

      return { orders, total, page: input.page, limit: input.limit };
    }),

  // 獲取訂單詳情
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.order.findUnique({
        where: { id: parseInt(input.id) },
        include: { user: true, schedules: true },
      });
    }),

  // 月度統計
  getMonthlyStats: publicProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const [orders, total, monthlyStats] = await Promise.all([
        prisma.order.findMany({
          where: {
            orderDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: { user: true },
          orderBy: { orderDate: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        prisma.order.count({
          where: {
            orderDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        prisma.order.aggregate({
          where: {
            orderDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: { amount: true, bags: true },
        }),
      ]);

      const totalAmount = monthlyStats._sum.amount || 0;
      const totalBags = monthlyStats._sum.bags || 0;

      return {
        orders,
        total,
        totalAmount,
        totalBags,
        page: input.page,
        limit: input.limit,
      };
    }),
});
