import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AuthPage from "@/pages/AuthPage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminOrders from "@/pages/AdminOrders";
import AdminCustomers from "@/pages/AdminCustomers";
import AdminAnalytics from "@/pages/AdminAnalytics";
import CustomerOrders from "@/pages/CustomerOrders";
import CustomerHome from "@/pages/CustomerHome";
import CustomerNewOrder from "@/pages/CustomerNewOrder";
import CustomerHistory from "@/pages/CustomerHistory";
import Profile from "@/pages/Profile";

export default function App() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // 未登入 → 導向登入頁面
    if (!user && location !== "/login") {
      setLocation("/login");
      return;
    }

    // 已登入但在登入頁面 → 根據身份導向
    if (user && location === "/login") {
      if (user.role === "ADMIN" || user.role === "admin") {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/orders");
      }
      return;
    }

    // 非管理員試圖進入管理員頁面 → 導向客戶頁面
    if (user && location.startsWith("/admin") && user.role !== "ADMIN" && user.role !== "admin") {
      setLocation("/orders");
      return;
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  return (
    <>
      {location === "/login" && <AuthPage />}
      
      {location === "/admin/dashboard" && (
        <ProtectedRoute requiredRole="ADMIN">
          <AdminDashboard />
        </ProtectedRoute>
      )}
      
      {location === "/admin/orders" && (
        <ProtectedRoute requiredRole="ADMIN">
          <AdminOrders />
        </ProtectedRoute>
      )}
      
      {location === "/admin/customers" && (
        <ProtectedRoute requiredRole="ADMIN">
          <AdminCustomers />
        </ProtectedRoute>
      )}
      
      {location === "/admin/analytics" && (
        <ProtectedRoute requiredRole="ADMIN">
          <AdminAnalytics />
        </ProtectedRoute>
      )}
      
      {location === "/orders" && (
        <ProtectedRoute requiredRole="CUSTOMER">
          <CustomerOrders />
        </ProtectedRoute>
      )}
      
      {location === "/customer/home" && (
        <ProtectedRoute requiredRole="CUSTOMER">
          <CustomerHome />
        </ProtectedRoute>
      )}
      
      {location === "/customer/new-order" && (
        <ProtectedRoute requiredRole="CUSTOMER">
          <CustomerNewOrder />
        </ProtectedRoute>
      )}
      
      {location === "/customer/history" && (
        <ProtectedRoute requiredRole="CUSTOMER">
          <CustomerHistory />
        </ProtectedRoute>
      )}
      
      {location === "/customer/profile" && (
        <ProtectedRoute requiredRole="CUSTOMER">
          <Profile />
        </ProtectedRoute>
      )}

      {/* 未定義的路由 → 根據身份導向 */}
      {location !== "/login" && 
       location !== "/admin/dashboard" && 
       location !== "/admin/orders" &&
       location !== "/admin/customers" &&
       location !== "/admin/analytics" &&
       location !== "/orders" &&
       location !== "/customer/home" &&
       location !== "/customer/new-order" &&
       location !== "/customer/history" &&
       location !== "/customer/profile" &&
       user && (
        <>
          {user.role === "ADMIN" ? (
            <AdminDashboard />
          ) : (
            <CustomerOrders />
          )}
        </>
      )}
    </>
  );
}
