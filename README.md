# 訂單與排程管理系統

一個為洗衣服務業設計的現代化訂單與排程管理平台，支援管理者和客戶雙端操作，提供完整的訂單生命週期管理。

## 🎯 系統概述

本系統是一個全棧 Web 應用，採用 **React 19 + Tailwind 4 + Express 4 + tRPC 11** 技術棧，整合 Manus OAuth 身份驗證和 MySQL/TiDB 資料庫。

### 核心功能

**管理者後台**：
- 📊 訂單管理與排程顯示（當日、分類檢視）
- 👥 會員資料管理（含完整歷史訂單）
- 📈 營業概況統計（月份篩選、營業額統計）
- ✅ 訂單進度追蹤（尚未收件 → 已收件 → 清洗中 → 準備送回 → 完成）
- 🔔 完成訂單二次確認機制

**客戶前台**：
- 📋 訂單列表與進度追蹤
- ➕ 新增訂單（自動帶入會員資料）
- 📸 衣物編號管理與照片上傳
- ✨ 已完成訂單欄位（自動消失機制）
- 📱 歷史訂單查看
- 👤 個人資料管理

**系統特性**：
- 🔐 基於角色的存取控制（Admin / User）
- 📱 完全自適應設計（電腦、平板、手機）
- 🎨 工業風灰階設計風格
- ⚡ 即時資料同步
- 🔄 側邊面板 Fixed 定位（不壓縮背景）

---

## 🚀 快速開始

### 環境要求

- Node.js 22.13.0+
- pnpm 9.0.0+
- MySQL 8.0+ 或 TiDB

### 安裝步驟

```bash
# 1. 克隆倉庫
git clone <repository-url>
cd order_schedule_system

# 2. 安裝依賴
pnpm install

# 3. 設置環境變數
# 複製 .env.example 到 .env，並填入必要的環境變數
cp .env.example .env

# 4. 資料庫遷移
pnpm drizzle-kit push

# 5. 啟動開發服務器
pnpm dev
```

開發服務器將在 `http://localhost:3000` 啟動。

---

## 📁 項目結構

```
order_schedule_system/
├── client/                    # React 前端應用
│   ├── src/
│   │   ├── pages/            # 頁面組件
│   │   ├── components/       # 可重用組件
│   │   ├── lib/              # 工具函數
│   │   ├── App.tsx           # 路由配置
│   │   └── index.css         # 全局樣式
│   ├── public/               # 靜態資源
│   └── index.html            # HTML 入口
├── server/                    # Express 後端
│   ├── routers.ts            # tRPC 路由定義
│   ├── db.ts                 # 資料庫查詢助手
│   ├── auth.logout.test.ts   # 測試文件
│   └── _core/                # 核心功能（OAuth、LLM、存儲）
├── drizzle/                   # 資料庫 Schema
│   └── schema.ts             # ORM 定義
├── shared/                    # 共享常數與類型
└── package.json              # 專案配置
```

---

## 🔑 環境變數

系統自動注入以下環境變數（無需手動設置）：

| 變數名 | 用途 | 來源 |
|--------|------|------|
| `DATABASE_URL` | MySQL/TiDB 連接字符串 | 系統提供 |
| `JWT_SECRET` | Session cookie 簽名密鑰 | 系統提供 |
| `VITE_APP_ID` | Manus OAuth 應用 ID | 系統提供 |
| `OAUTH_SERVER_URL` | OAuth 服務器 URL | 系統提供 |
| `VITE_OAUTH_PORTAL_URL` | OAuth 登入入口 URL | 系統提供 |
| `OWNER_OPEN_ID` | 系統所有者 ID | 系統提供 |
| `OWNER_NAME` | 系統所有者名稱 | 系統提供 |
| `BUILT_IN_FORGE_API_URL` | Manus 內置 API URL | 系統提供 |
| `BUILT_IN_FORGE_API_KEY` | Manus API 密鑰 | 系統提供 |
| `VITE_FRONTEND_FORGE_API_URL` | 前端 API URL | 系統提供 |
| `VITE_FRONTEND_FORGE_API_KEY` | 前端 API 密鑰 | 系統提供 |

---

## 🔐 身份驗證與授權

### 登入流程

1. 用戶訪問 `/login` 頁面
2. 點擊「使用 Manus 登入」按鈕
3. 重定向到 Manus OAuth 服務器
4. 驗證成功後返回應用，設置 Session Cookie
5. 根據用戶角色重定向到相應首頁

### 角色與權限

| 角色 | 存取範圍 | 功能 |
|------|---------|------|
| **Admin** | 全系統 | 訂單管理、會員管理、統計報表、進度更新 |
| **User** | 個人訂單 | 新增訂單、查看進度、上傳照片、管理資料 |

---

## 📊 資料庫 Schema

### 主要表格

**users** - 用戶帳戶
```typescript
{
  id: number,
  openId: string,           // Manus OAuth ID
  name: string,
  role: 'admin' | 'user',
  createdAt: Date,
  updatedAt: Date
}
```

**customers** - 客戶信息
```typescript
{
  id: number,
  userId: number,           // 關聯用戶
  phone: string,
  address: string,
  createdAt: Date,
  updatedAt: Date
}
```

**orders** - 訂單
```typescript
{
  id: number,
  customerId: number,
  orderNumber: string,      // 格式: YYMMDD-XX
  orderStatus: 'pending' | 'scheduled' | 'completed',
  progress: 'pending' | 'received' | 'washing' | 'returning' | 'completed',
  deliveryType: 'pickup' | 'self',
  bagCount: number,
  paymentMethod: string,
  paymentStatus: string,
  estimatedCompletion: Date,
  completedAt: Date | null,
  notes: string,
  createdAt: Date,
  updatedAt: Date
}
```

**orderItems** - 訂單衣物
```typescript
{
  id: number,
  orderId: number,
  itemNumber: string,       // 格式: YYMMDD-XX-YY
  notes: string,
  createdAt: Date,
  updatedAt: Date
}
```

**orderItemPhotos** - 衣物照片
```typescript
{
  id: number,
  orderItemId: number,
  photoUrl: string,         // S3 URL
  sequenceNumber: number,
  createdAt: Date
}
```

---

## 🎨 設計系統

### 色彩方案

| 用途 | 顏色 | 用途 |
|------|------|------|
| 背景 | `#FFFFFF` (白色) | 主背景 |
| 文字 | `#111827` (深灰) | 主文字 |
| 邊框 | `#E5E7EB` (淺灰) | 分隔線 |
| 進度 - 待處理 | `#6B7280` (灰色) | 尚未收件 |
| 進度 - 進行中 | `#3B82F6` (藍色) | 已收件、清洗中 |
| 進度 - 完成 | `#10B981` (綠色) | 完成 |

### 字體

- **標題**：超大粗體（3xl, font-bold）
- **副標題**：細致全大寫（sm, uppercase）
- **正文**：標準大小（base）

### 響應式斷點

- **手機**：< 640px
- **平板**：640px - 1024px
- **桌面**：> 1024px

---

## 🔄 訂單生命週期

```
┌─────────────┐
│  待處理     │  客戶下訂單
│ (pending)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  已排程     │  管理者確認排程
│(scheduled)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  已收件     │  管理者標記收件
│(received)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  清洗中     │  管理者更新進度
│ (washing)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 準備送回    │  管理者更新進度
│(returning)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  已完成     │  管理者確認完成
│(completed)  │  (二次確認)
└─────────────┘
```

### 已完成訂單自動消失機制

- 訂單完成後，`completedAt` 被設置為當前時間
- 客戶首頁會顯示完成日期後 0-2 天內的訂單
- 第 3 天開始自動從首頁消失
- 訂單仍保存在「歷史訂單」中供查詢

---

## 🧪 測試

### 運行測試

```bash
# 運行所有測試
pnpm test

# 監視模式
pnpm test:watch

# 生成覆蓋率報告
pnpm test:coverage
```

### 測試文件位置

測試文件位於 `server/` 目錄中，命名規則為 `*.test.ts`。

### 示例測試

```typescript
// server/auth.logout.test.ts
import { describe, it, expect } from 'vitest';

describe('Auth Logout', () => {
  it('should logout user successfully', async () => {
    // 測試邏輯
  });
});
```

---

## 📱 前端工作流

### 頁面架構

**管理者頁面**（AdminLayout）：
- 深色側邊欄導航
- 頂部導航欄（用戶資訊、登出）
- 主內容區域

**客戶頁面**（CustomerLayout）：
- 淺色側邊欄導航
- 頂部導航欄
- 主內容區域

### 路由配置

```typescript
// 公開路由
/login                    // 登入頁面
/auth/callback           // OAuth 回調

// 管理者路由 (需要 admin 角色)
/admin/home              // 首頁
/admin/orders            // 訂單管理
/admin/customers         // 會員管理
/admin/statistics        // 營業概況

// 客戶路由 (需要 user 角色)
/customer/home           // 首頁
/customer/create-order   // 新增訂單
/customer/order/:id      // 訂單詳情
/customer/history        // 歷史訂單
/customer/profile        // 個人資料
```

### tRPC 使用示例

```typescript
// 查詢資料
const { data, isLoading } = trpc.order.getMyOrders.useQuery();

// 修改資料
const mutation = trpc.order.create.useMutation();
mutation.mutate({
  bagCount: 3,
  notes: '請小心清洗'
});
```

---

## 🔧 開發指南

### 添加新功能

1. **更新資料庫 Schema**
   ```bash
   # 編輯 drizzle/schema.ts
   pnpm drizzle-kit generate
   pnpm drizzle-kit push
   ```

2. **添加後端 API**
   ```typescript
   // server/routers.ts
   export const appRouter = router({
     newFeature: protectedProcedure
       .input(z.object({ /* ... */ }))
       .mutation(async ({ input, ctx }) => {
         // 實現邏輯
       })
   });
   ```

3. **添加前端 UI**
   ```typescript
   // client/src/pages/NewFeature.tsx
   const { data } = trpc.newFeature.useQuery();
   ```

4. **編寫測試**
   ```typescript
   // server/newFeature.test.ts
   describe('New Feature', () => {
     it('should work correctly', async () => {
       // 測試邏輯
     });
   });
   ```

### 常見任務

**修改訂單狀態流程**：
- 編輯 `PROGRESS_LABELS` 和 `PROGRESS_COLORS`（client/src/pages/）
- 更新後端進度驗證邏輯（server/routers.ts）

**添加新的統計維度**：
- 擴展 `getOrderStatistics` 函數（server/db.ts）
- 添加新的統計圖表（client/src/pages/AdminStatistics.tsx）

**自定義設計樣式**：
- 編輯全局樣式（client/src/index.css）
- 修改 Tailwind 配置（tailwind.config.ts）

---

## 🚀 部署

### 構建生產版本

```bash
# 構建前端
pnpm build

# 構建後端
pnpm build:server
```

### 部署到 Manus

1. 在 Manus 管理面板中創建新項目
2. 連接 GitHub 倉庫
3. 配置環境變數
4. 點擊「Publish」按鈕

系統將自動構建並部署到 `ordersched-qtmrz6ys.manus.space`。

---

## 🐛 故障排除

### 常見問題

**Q: 登入後頁面白色無反應**
- A: 檢查 `VITE_APP_ID` 和 `OAUTH_SERVER_URL` 環境變數是否正確

**Q: 訂單無法保存**
- A: 確認資料庫連接正常（`DATABASE_URL`），檢查 `orderNumber` 格式

**Q: 照片上傳失敗**
- A: 檢查 S3 存儲配置和 `BUILT_IN_FORGE_API_KEY` 是否有效

**Q: 側邊欄壓縮背景內容**
- A: 確認側邊欄使用 `position: fixed` 和 `z-index: 50`

### 查看日誌

```bash
# 查看開發服務器日誌
tail -f .manus-logs/devserver.log

# 查看客戶端控制台日誌
tail -f .manus-logs/browserConsole.log

# 查看網絡請求日誌
tail -f .manus-logs/networkRequests.log
```

---

## 📞 支持

如有問題或建議，請：

1. 查看 [USAGE.md](./USAGE.md) 操作指南
2. 檢查 [todo.md](./todo.md) 已知問題
3. 提交 GitHub Issue

---

## 📄 許可證

本項目採用 MIT 許可證。詳見 [LICENSE](./LICENSE) 文件。

---

## 🙏 致謝

感謝使用本系統。我們致力於為洗衣服務業提供最佳的數位化解決方案。

**最後更新**：2026 年 4 月 26 日  
**版本**：1.0.0  
**狀態**：生產就緒
