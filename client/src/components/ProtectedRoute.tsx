import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // 未登入 → 導向登入頁面
    if (!user) {
      setLocation("/login");
      return;
    }

    // 檢查角色權限
    if (requiredRole) {
      const userRole = (user.role || "").toLowerCase();
      
      // 角色必須完全匹配
      if (userRole !== requiredRole) {
        // admin 試圖進入 user 頁面 → 導向管理員頁面
        if (userRole === "admin" && requiredRole === "user") {
          setLocation("/admin/dashboard");
          return;
        }
        // user 試圖進入 admin 頁面 → 導向客戶頁面
        if (userRole === "user" && requiredRole === "admin") {
          setLocation("/customer/home");
          return;
        }
        // 其他權限不符 → 導向指定頁面
        setLocation(redirectTo);
        return;
      }
    }

    setIsAuthorized(true);
  }, [user, isLoading, requiredRole, redirectTo, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
