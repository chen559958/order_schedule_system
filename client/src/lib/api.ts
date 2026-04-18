const BASE_URL = 'http://localhost:3000/trpc';

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch(`${BASE_URL}/auth.login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.result.data;
    },
    register: async (email: string, password: string, name?: string) => {
      const res = await fetch(`${BASE_URL}/auth.register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.result.data;
    },
  },
  orders: {
    create: async (userId: string, bags: number, amount: number, deliveryMethod: string, paymentMethod: string, notes?: string) => {
      const res = await fetch(`${BASE_URL}/orders.create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bags, amount, deliveryMethod, paymentMethod, notes }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.result.data;
    },
    listByUser: async (userId: string, page = 1, limit = 10) => {
      const res = await fetch(`${BASE_URL}/orders.listByUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, page, limit }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.result.data;
    },
    getMonthlyStats: async (year: number, month: number, page = 1, limit = 20) => {
      const res = await fetch(`${BASE_URL}/orders.getMonthlyStats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, page, limit }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.result.data;
    },
  },
  schedules: {
    getTodaySchedules: async () => {
      const res = await fetch(`${BASE_URL}/schedules.getTodaySchedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.result.data;
    },
  },
  members: {
    search: async (query: string, page = 1, limit = 20) => {
      const res = await fetch(`${BASE_URL}/members.search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, page, limit }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.result.data;
    },
  },
};
