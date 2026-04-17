import { router, publicProcedure } from '../trpc.js';
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
    .input(z.object({ 
      email: z.string().email(), 
      password: z.string().min(6),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error('User already exists');
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

  me: publicProcedure
    .query(async () => {
      // 在實際應用中，這應該從 context 中獲取當前用戶
      return null;
    }),
});
