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
import CustomerOrderOverview from "@/pages/CustomerOrderOverview";
import CustomerOrderItems from "@/pages/CustomerOrderItems";
import Profile from "@/pages/Profile";
import OrderDetail from "@/pages/OrderDetail";

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
      if (user.role === "admin") {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/customer/home");
      }
      return;
    }

    // 非管理員試圖進入管理員頁面 → 導向客戶頁面
    if (user && location.startsWith("/admin") && user.role !== "admin") {
      setLocation("/customer/home");
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
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      )}
      
      {location === "/admin/orders" && (
        <ProtectedRoute requiredRole="admin">
          <AdminOrders />
        </ProtectedRoute>
      )}
      
      {location === "/admin/customers" && (
        <ProtectedRoute requiredRole="admin">
          <AdminCustomers />
        </ProtectedRoute>
      )}
      
      {location === "/admin/analytics" && (
        <ProtectedRoute requiredRole="admin">
          <AdminAnalytics />
        </ProtectedRoute>
      )}
      
      {/* /orders 路由已移除，統一使用 /customer/home */}
      
      {location === "/customer/home" && (
        <ProtectedRoute requiredRole="user">
          <CustomerHome />
        </ProtectedRoute>
      )}
      
      {location === "/customer/new-order" && (
        <ProtectedRoute requiredRole="user">
          <CustomerNewOrder />
        </ProtectedRoute>
      )}
      
      {location === "/customer/history" && (
        <ProtectedRoute requiredRole="user">
          <CustomerHistory />
        </ProtectedRoute>
      )}
      
      {location === "/customer/profile" && (
        <ProtectedRoute requiredRole="user">
          <Profile />
        </ProtectedRoute>
      )}
      
      {location.startsWith("/order/") && (
        <ProtectedRoute requiredRole="user" allowAdmin={true}>
          <OrderDetail />
        </ProtectedRoute>
      )}
      
      {location.startsWith("/customer/order/") && location.includes("/overview") && (
        <ProtectedRoute requiredRole="user">
          <CustomerOrderOverview />
        </ProtectedRoute>
      )}
      
      {location.startsWith("/customer/order/") && location.includes("/items") && (
        <ProtectedRoute requiredRole="user">
          <CustomerOrderItems />
        </ProtectedRoute>
      )}

      {/* 未定義的路由 → 根據身份導向 */}
      {location !== "/login" && 
       location !== "/admin/dashboard" && 
       location !== "/admin/orders" &&
       location !== "/admin/customers" &&
       location !== "/admin/analytics" &&

       location !== "/customer/home" &&
       location !== "/customer/new-order" &&
       location !== "/customer/history" &&
       location !== "/customer/profile" &&
       !location.startsWith("/order/") &&
       !location.startsWith("/customer/order/") &&
       user && (
        <>
          {user.role === "admin" ? (
            <AdminDashboard />
          ) : (
            <CustomerHome />
          )}
        </>
      )}
    </>
  );
}
