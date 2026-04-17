import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { ordersRouter } from './orders.js';
import { schedulesRouter } from './schedules.js';
import { membersRouter } from './members.js';

export const appRouter = router({
  auth: authRouter,
  orders: ordersRouter,
  schedules: schedulesRouter,
  members: membersRouter,
});

export type AppRouter = typeof appRouter;
