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
          sidebarOpen ? "w-40" : "w-14"
        } bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col`}
      >
        {/* Logo 區域 */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h1 className={`font-bold text-white ${sidebarOpen ? "text-lg" : "hidden"}`}>
              {sidebarOpen ? "LAUNDRY" : ""}
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {sidebarOpen ? (
                "←"
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
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
              title={!sidebarOpen ? item.label : ""}
            >
              {sidebarOpen ? item.label : item.label.charAt(0)}
            </button>
          ))}
        </nav>

        {/* 用戶信息與登出 */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-800 space-y-3">
            <div className="text-xs text-gray-400">
              <p className="font-semibold text-gray-300">{user?.name}</p>
              <p>{user?.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full"
            >
              登出
            </Button>
          </div>
        )}
        {!sidebarOpen && (
          <div className="p-4 border-t border-gray-800">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full p-0"
              title="登出"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        )}
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
