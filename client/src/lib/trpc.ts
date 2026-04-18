import { createTRPCReact } from '@trpc/react-query';

// 使用 any 類型避免跨邊界導入問題
// 在運行時，tRPC 會正確推導類型
export const trpc = createTRPCReact<any>();
