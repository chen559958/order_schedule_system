export async function createContext() {
  return {
    user: null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
