import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const navItems = [
    { label: "首頁", path: "/customer/home", icon: "H" },
    { label: "新增訂單", path: "/customer/new-order", icon: "+" },
    { label: "歷史訂單", path: "/customer/history", icon: "L" },
    { label: "個人資料", path: "/customer/profile", icon: "P" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 側邊欄 */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`font-bold text-lg text-blue-600 ${!sidebarOpen && "hidden"}`}>
              LAUNDRY
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <span className="text-xl">{sidebarOpen ? "←" : "☰"}</span>
            </button>
          </div>
        </div>

        {/* 導航菜單 */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition text-left"
            >
              <span className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded text-blue-600 font-semibold text-sm flex-shrink-0">
                {item.icon}
              </span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* 用戶信息和登出 */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          {sidebarOpen && (
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">{user?.name || "使用者"}</p>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 hover:bg-red-100 text-sm"
            variant="outline"
          >
            {sidebarOpen ? "登出" : "出"}
          </Button>
        </div>
      </div>

      {/* 主內容區 */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
