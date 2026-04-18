import { db } from '../server/db.js';
import { users } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seed() {
  console.log('🌱 開始初始化測試帳號...');

  try {
    // 檢查管理員帳號是否存在
    const adminExists = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@test.com'))
      .limit(1);

    if (adminExists.length === 0) {
      await db.insert(users).values({
        email: 'admin@test.com',
        password: hashPassword('admin123'),
        name: '管理員',
        role: 'admin',
        loginMethod: 'email',
        openId: 'admin_' + Date.now(),
      });
      console.log('✅ 管理員帳號已創建: admin@test.com / admin123');
    } else {
      console.log('⏭️  管理員帳號已存在');
    }

    // 檢查客戶帳號是否存在
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.email, 'user@test.com'))
      .limit(1);

    if (userExists.length === 0) {
      await db.insert(users).values({
        email: 'user@test.com',
        password: hashPassword('user123'),
        name: '測試客戶',
        role: 'user',
        loginMethod: 'email',
        openId: 'user_' + Date.now(),
      });
      console.log('✅ 客戶帳號已創建: user@test.com / user123');
    } else {
      console.log('⏭️  客戶帳號已存在');
    }

    console.log('✨ 初始化完成！');
  } catch (error) {
    console.error('❌ 初始化失敗:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

seed();
