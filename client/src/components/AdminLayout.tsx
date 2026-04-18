import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const navigationItems = [
    { label: "首頁", path: "/admin/dashboard" },
    { label: "訂單概況", path: "/admin/orders" },
    { label: "會員資料", path: "/admin/customers" },
    { label: "營業概況", path: "/admin/analytics" },
  ];

  return (
    <div className="flex h-screen bg-gray-950">
      {/* 側邊欄 */}
      <aside
        className={`${
          sidebarOpen ? "w-48" : "w-16"
        } bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col`}
      >
        {/* Logo 區域 */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h1 className={`font-bold text-white ${sidebarOpen ? "text-xl" : "text-xs"}`}>
              {sidebarOpen ? "LAUNDRY" : "L"}
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {sidebarOpen ? "←" : "→"}
            </button>
          </div>
        </div>

        {/* 導航菜單 */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className="w-full px-4 py-3 rounded-lg text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm"
            >
              {sidebarOpen ? item.label : item.label.charAt(0)}
            </button>
          ))}
        </nav>

        {/* 用戶信息與登出 */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className="text-xs text-gray-400">
            {sidebarOpen ? (
              <>
                <p className="font-semibold text-gray-300">{user?.name}</p>
                <p>{user?.email}</p>
              </>
            ) : (
              <p className="text-center">👤</p>
            )}
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {sidebarOpen ? "登出" : "出"}
          </Button>
        </div>
      </aside>

      {/* 主要內容區域 */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
