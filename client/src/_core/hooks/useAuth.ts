import { useEffect, useState, useCallback } from "react";

export interface User {
  id: number;
  email: string;
  name: string;
  role: "ADMIN" | "CUSTOMER" | "STAFF";
  token?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化時從 localStorage 讀取用戶信息
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  // 監聽 localStorage 變化（用於跨標籤頁同步）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        if (e.newValue) {
          try {
            const userData = JSON.parse(e.newValue);
            setUser(userData);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback((userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token || "");
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
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
