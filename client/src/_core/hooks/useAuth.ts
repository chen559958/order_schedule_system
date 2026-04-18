import { useEffect, useState } from "react";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "staff" | "user";
  token?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 從 localStorage 讀取用戶信息
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (err) {
        setError(err as Error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const logout = async () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    logout,
    refresh: () => {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } catch (err) {
          setError(err as Error);
        }
      }
    }
  };
}
