import express from 'express';
import cors from 'cors';
import { createContext } from './context.js';
import { appRouter } from './routers/index.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

// tRPC 路由
app.post('/trpc/:procedure', async (req, res) => {
  try {
    const { procedure } = req.params;
    const caller = appRouter.createCaller(await createContext());
    
    // 解析 procedure 路徑 (e.g., "auth.login" -> ["auth", "login"])
    const parts = procedure.split('.');
    
    // 動態調用路由
    let target: any = caller;
    for (const part of parts) {
      target = target[part];
    }
    
    if (typeof target !== 'function') {
      return res.status(400).json({ error: 'Invalid procedure' });
    }
    
    const result = await target(req.body.json || req.body);
    res.json({ result: { data: result } });
  } catch (error: any) {
    console.error('tRPC error:', error);
    res.status(400).json({ 
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Internal server error'
      }
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
