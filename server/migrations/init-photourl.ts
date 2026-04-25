/**
 * 一次性初始化遷移腳本
 * 檢查並添加 photoUrl 欄位到 orderItems 表
 * 在應用啟動時自動執行
 */

import { getDb } from '../db';

export async function initializePhotoUrlColumn() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[Migration] Database not available, skipping photoUrl initialization');
      return;
    }

    console.log('[Migration] Starting photoUrl column initialization...');
    
    // 直接嘗試添加 photoUrl 欄位
    // 使用 IF NOT EXISTS 避免重複添加
    try {
      await db.execute(`
        ALTER TABLE orderItems ADD COLUMN IF NOT EXISTS photoUrl text
      `);
      console.log('[Migration] ✅ photoUrl column ensured successfully');
    } catch (alterError: any) {
      // 如果 MySQL 版本不支持 IF NOT EXISTS，嘗試其他方式
      if (alterError.code === 'ER_DUP_FIELDNAME') {
        console.log('[Migration] ✅ photoUrl column already exists');
      } else if (alterError.message?.includes('Syntax error')) {
        // MySQL 5.7 不支持 IF NOT EXISTS，改用傳統方式
        console.log('[Migration] MySQL version does not support IF NOT EXISTS, using traditional ALTER...');
        try {
          await db.execute(`
            ALTER TABLE orderItems ADD COLUMN photoUrl text
          `);
          console.log('[Migration] ✅ photoUrl column added successfully');
        } catch (innerError: any) {
          if (innerError.code === 'ER_DUP_FIELDNAME') {
            console.log('[Migration] ✅ photoUrl column already exists');
          } else {
            throw innerError;
          }
        }
      } else {
        throw alterError;
      }
    }
  } catch (error) {
    console.error('[Migration] Error during photoUrl initialization:', error);
    // 不拋出錯誤，讓應用繼續運行
  }
}
