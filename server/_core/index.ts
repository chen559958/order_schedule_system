import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // 照相上傳端點
  app.post("/api/upload-photo", async (req, res) => {
    try {
      const { storagePut } = await import('../storage');
      const multer = await import('multer');
      const upload = multer.default({ storage: multer.default.memoryStorage() });
      
      // 使用 multer 中間件解析 multipart/form-data
      upload.single('file')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: '檔案上傳失敗' });
        }
        
        const file = (req as any).file;
        if (!file) {
          return res.status(400).json({ error: '沒有檔案' });
        }
        
        try {
          // 生成唯一的檔案名稱
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(7);
          const fileKey = `photos/${timestamp}-${random}-${file.originalname}`;
          
          // 上傳到 S3
          const { url } = await storagePut(fileKey, file.buffer, file.mimetype);
          
          res.json({ url, success: true });
        } catch (uploadError: any) {
          console.error('S3 upload error:', uploadError);
          res.status(500).json({ error: '上傳到雲端失敗', details: uploadError.message });
        }
      });
    } catch (error: any) {
      console.error('Upload endpoint error:', error);
      res.status(500).json({ error: error.message || '上傳失敗' });
    }
  });
  
  // 原生登入和註冊 API 端點
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "缺少帳號或密碼" });
      }
      
      const crypto = await import('crypto');
      const hashedPassword = crypto.default.createHash('sha256').update(password).digest('hex');
      
      const { getDb } = await import('../db');
      const { users } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "資料庫連接失敗" });
      }
      
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (result.length === 0 || result[0].password !== hashedPassword) {
        return res.status(401).json({ error: "帳號或密碼錯誤" });
      }
      
      res.json({
        id: result[0].id,
        email: result[0].email,
        name: result[0].name,
        role: result[0].role,
        token: 'token_' + result[0].id,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "登入失敗" });
    }
  });

  // 添加 getMe API 端點
  app.get("/api/auth/me", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: "未授權" });
      }
      
      // 從 token 提取用戶 ID (token 格式: token_<userId>)
      const userId = parseInt(token.replace('token_', ''));
      
      const { getDb } = await import('../db');
      const { users } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "資料庫連接失敗" });
      }
      
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (result.length === 0) {
        return res.status(401).json({ error: "用戶不存在" });
      }
      
      res.json({
        id: result[0].id,
        email: result[0].email,
        name: result[0].name,
        role: result[0].role,
        token: 'token_' + result[0].id,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "獲取用戶信息失敗" });
    }
  });
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, fullName } = req.body;
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: "缺少必要欄位" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: "密碼至少需要6個字符" });
      }
      
      const crypto = await import('crypto');
      const hashedPassword = crypto.default.createHash('sha256').update(password).digest('hex');
      
      const { getDb } = await import('../db');
      const { users } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "資料庫連接失敗" });
      }
      
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "該 Email 已被註冊" });
      }
      
      await db.insert(users).values({
        email,
        password: hashedPassword,
        name: fullName,
        role: 'user',
        loginMethod: 'email',
        openId: 'user_' + Date.now(),
      });
      
      res.json({ success: true, message: "註冊成功，請登入" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "註冊失敗" });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
