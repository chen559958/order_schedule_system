import { router, publicProcedure } from '../trpc.js';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const membersRouter = router({
  // 搜尋會員（按名稱或電話）
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.limit;

      // 搜尋名稱或郵箱
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: input.query } },
              { email: { contains: input.query } },
            ],
            role: 'CUSTOMER',
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({
          where: {
            OR: [
              { name: { contains: input.query } },
              { email: { contains: input.query } },
            ],
            role: 'CUSTOMER',
          },
        }),
      ]);

      return {
        users,
        total,
        page: input.page,
        limit: input.limit,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // 獲取所有會員
  listAll: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: { role: 'CUSTOMER' },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
      ]);

      return {
        users,
        total,
        page: input.page,
        limit: input.limit,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // 獲取會員詳情
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.id },
        include: {
          orders: {
            orderBy: { orderDate: 'desc' },
            take: 10,
          },
          schedules: {
            orderBy: { scheduleDate: 'desc' },
            take: 10,
          },
        },
      });

      return user;
    }),

  // 更新會員資訊
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const data: any = {};
      if (input.name) data.name = input.name;
      if (input.email) data.email = input.email;

      const user = await prisma.user.update({
        where: { id: input.id },
        data,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }),

  // 獲取會員統計
  getStats: publicProcedure.query(async () => {
    const totalMembers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    const totalOrders = await prisma.order.count();

    const totalAmount = await prisma.order.aggregate({
      _sum: { amount: true },
    });

    return {
      totalMembers,
      totalOrders,
      totalAmount: totalAmount._sum.amount || 0,
    };
  }),
});
