import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export function Layout({ children, pageTitle }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isAdmin = user?.role === "admin" || user?.role === "ADMIN";

  const adminMenuItems = [
    { label: "當日排程", href: "/admin/dashboard", icon: "📅" },
    { label: "訂單管理", href: "/admin/orders", icon: "📦" },
    { label: "客戶清單", href: "/admin/customers", icon: "👥" },
    { label: "系統設定", href: "/admin/settings", icon: "⚙️" },
  ];

  const customerMenuItems = [
    { label: "我的訂單", href: "/orders", icon: "📋" },
    { label: "新增訂單", href: "/orders/new", icon: "+" },
    { label: "預約排程", href: "/orders/schedule", icon: "📆" },
    { label: "個人資料", href: "/profile", icon: "👤" },
  ];

  const menuItems = isAdmin ? adminMenuItems : customerMenuItems;

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 側邊欄 */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Logo 區域 */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">LAUNDRY</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            {sidebarOpen ? "←" : "→"}
          </button>
        </div>

        {/* 選單項目 */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition text-sm font-medium"
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* 用戶信息 */}
        <div className="p-4 border-t border-slate-700">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-xs text-slate-400">登入用戶</p>
              <p className="text-sm font-semibold truncate">{user?.name}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition"
          >
            {sidebarOpen ? "登出" : "出"}
          </button>
        </div>
      </aside>

      {/* 主內容區 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 頂部欄 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              ☰
            </button>
            <h2 className="text-2xl font-bold text-gray-800">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              登出
            </button>
          </div>
        </header>

        {/* 主內容 */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
