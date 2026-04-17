import { publicProcedure, router } from '../trpc.js';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user || user.password !== input.password) {
        throw new Error('Invalid credentials');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }),

  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new Error('Email already exists');
      }

      const user = await prisma.user.create({
        data: {
          email: input.email,
          password: input.password,
          name: input.name,
          role: 'CUSTOMER',
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }),

  getMe: publicProcedure.query(async () => {
    return null;
  }),
});
