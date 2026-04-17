import { router, publicProcedure } from '../trpc.js';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const schedulesRouter = router({
  // 創建排程
  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        orderId: z.string(),
        scheduleDate: z.string(),
        deliveryTime: z.string().optional(),
        deliveryType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const schedule = await prisma.schedule.create({
        data: {
          userId: input.userId,
          orderId: input.orderId,
          scheduleDate: new Date(input.scheduleDate),
          deliveryTime: input.deliveryTime || '',
          deliveryType: input.deliveryType,
          isCompleted: false,
        },
        include: {
          user: true,
          order: true,
        },
      });

      return schedule;
    }),

  // 獲取今日排程
  getTodaySchedules: publicProcedure.query(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedules = await prisma.schedule.findMany({
      where: {
        scheduleDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        user: true,
        order: true,
      },
      orderBy: { deliveryTime: 'asc' },
    });

    // 按配送類型分組
    const grouped = {
      'door-to-door-pickup': schedules.filter((s: any) => s.deliveryType === 'door-to-door-pickup'),
      'door-to-door-return': schedules.filter((s: any) => s.deliveryType === 'door-to-door-return'),
      'self-delivery': schedules.filter((s: any) => s.deliveryType === 'self-delivery'),
    };

    return grouped;
  }),

  // 獲取特定日期的排程
  getByDate: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      const date = new Date(input.date);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const schedules = await prisma.schedule.findMany({
        where: {
          scheduleDate: {
            gte: date,
            lt: nextDay,
          },
        },
        include: {
          user: true,
          order: true,
        },
        orderBy: { deliveryTime: 'asc' },
      });

      return schedules;
    }),

  // 獲取用戶的排程
  getByUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const schedules = await prisma.schedule.findMany({
        where: { userId: input.userId },
        include: {
          user: true,
          order: true,
        },
        orderBy: { scheduleDate: 'desc' },
      });

      return schedules;
    }),

  // 更新排程時間
  updateTime: publicProcedure
    .input(
      z.object({
        id: z.string(),
        scheduleDate: z.string().optional(),
        deliveryTime: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const data: any = {};
      if (input.scheduleDate) {
        data.scheduleDate = new Date(input.scheduleDate);
      }
      if (input.deliveryTime !== undefined) {
        data.deliveryTime = input.deliveryTime;
      }

      const schedule = await prisma.schedule.update({
        where: { id: input.id },
        data,
        include: {
          user: true,
          order: true,
        },
      });

      return schedule;
    }),

  // 標記排程為已完成
  markCompleted: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const schedule = await prisma.schedule.update({
        where: { id: input.id },
        data: { isCompleted: true },
        include: {
          user: true,
          order: true,
        },
      });

      return schedule;
    }),

  // 標記排程為未完成
  markIncomplete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const schedule = await prisma.schedule.update({
        where: { id: input.id },
        data: { isCompleted: false },
        include: {
          user: true,
          order: true,
        },
      });

      return schedule;
    }),

  // 獲取排程詳情
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const schedule = await prisma.schedule.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          order: true,
        },
      });

      return schedule;
    }),
});
