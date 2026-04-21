import { useEffect, useState, useCallback, useRef } from "react";

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  token?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // 從 localStorage 讀取用戶信息的輔助函數
  const loadUserFromStorage = useCallback(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        // 保持 role 小寫以匹配後端
        console.log("[useAuth] 從 localStorage 讀取用戶:", userData);
        setUser(userData);
        return userData;
      } catch (err) {
        console.error("[useAuth] 解析 localStorage 用戶數據失敗:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        localStorage.removeItem("user");
      }
    } else {
      console.log("[useAuth] localStorage 中沒有用戶數據");
      setUser(null);
    }
    return null;
  }, []);

  // 初始化時從 localStorage 讀取用戶信息
  useEffect(() => {
    if (!hasInitialized.current) {
      console.log("[useAuth] 初始化 hook");
      loadUserFromStorage();
      setIsLoading(false);
      hasInitialized.current = true;
    }
  }, [loadUserFromStorage]);

  // 監聽 localStorage 變化（用於跨標籤頁同步和同一標籤頁的更新）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log("[useAuth] storage 事件觸發，key:", e.key);
      if (e.key === "user" || e.key === null) {
        if (e.newValue) {
          try {
            const userData = JSON.parse(e.newValue);
            // 保持 role 小寫以匹配後端
            console.log("[useAuth] 從 storage 事件更新用戶:", userData);
            setUser(userData);
          } catch (err) {
            console.error("[useAuth] 解析 storage 事件用戶數據失敗:", err);
            setError(err instanceof Error ? err.message : "Unknown error");
          }
        } else {
          console.log("[useAuth] 用戶已登出");
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback((userData: User) => {
    console.log("[useAuth] 執行 login，用戶數據:", userData);
    // 保持 role 小寫以匹配後端
    if (userData.role) {
      userData.role = userData.role.toLowerCase();
    }
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token || "");
    // 直接更新狀態，不依賴 storage 事件
    setUser(userData);
    console.log("[useAuth] login 完成，當前用戶:", userData);
  }, []);

  const logout = useCallback(() => {
    console.log("[useAuth] 執行 logout");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    logout,
  };
}
