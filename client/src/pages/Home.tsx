import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-black text-gray-100">LAUNDRY</div>
          {user ? (
            <div className="flex gap-4">
              {user.role === "admin" && (
                <Button
                  onClick={() => setLocation("/admin/dashboard")}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold"
                >
                  管理後台
                </Button>
              )}
              {user.role === "staff" && (
                <Button
                  onClick={() => setLocation("/staff/schedule")}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold"
                >
                  今日行程
                </Button>
              )}
              {user.role === "user" && (
                <>
                  <Button
                    onClick={() => setLocation("/place-order")}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold"
                  >
                    下單
                  </Button>
                  <Button
                    onClick={() => setLocation("/orders")}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold"
                  >
                    我的訂單
                  </Button>
                  <Button
                    onClick={() => setLocation("/profile")}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold"
                  >
                    個人資訊
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl md:text-7xl font-black text-gray-100 leading-tight mb-4">
                  洗衣物流
                  <br />
                  管理系統
                </h1>
                <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide">
                  LAUNDRY & LOGISTICS MANAGEMENT
                </p>
              </div>

              <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-md">
                自動化訂單管理、即時排程追蹤、專業物流配送。為您的洗衣與物流業務帶來現代化解決方案。
              </p>

              <div className="flex gap-4 pt-4">
                {user ? (
                  <>
                    {user.role === "user" && (
                      <Button
                        onClick={() => setLocation("/place-order")}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold px-8 py-6 text-lg"
                      >
                        立即下單
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    onClick={() => window.location.href = getLoginUrl()}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold px-8 py-6 text-lg"
                  >
                    登入系統
                  </Button>
                )}
              </div>
            </div>

            {/* Right Column - Geometric Design */}
            <div className="relative h-96 md:h-full">
              <div className="absolute inset-0 space-y-4">
                {/* Large gray blocks */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gray-800 opacity-60"></div>
                <div className="absolute top-32 left-0 w-64 h-32 bg-gray-700 opacity-40"></div>
                <div className="absolute bottom-0 right-12 w-56 h-56 bg-gray-800 opacity-50"></div>
                <div className="absolute bottom-20 left-12 w-40 h-40 bg-gray-700 opacity-30"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-900 border-t border-gray-800 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-4xl md:text-5xl font-black text-gray-100 mb-16">
            核心功能
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-800 p-8 border border-gray-700">
              <div className="w-16 h-16 bg-gray-700 mb-6"></div>
              <h3 className="text-2xl font-black text-gray-100 mb-4">自動化下單</h3>
              <p className="text-gray-400 leading-relaxed">
                客戶透過簡單的表單快速下單，系統自動記錄與分類，提升效率。
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-800 p-8 border border-gray-700">
              <div className="w-16 h-16 bg-gray-700 mb-6"></div>
              <h3 className="text-2xl font-black text-gray-100 mb-4">即時排程</h3>
              <p className="text-gray-400 leading-relaxed">
                管理者實時查看當日排程，手動設定送貨時間，掌握每一筆訂單。
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-800 p-8 border border-gray-700">
              <div className="w-16 h-16 bg-gray-700 mb-6"></div>
              <h3 className="text-2xl font-black text-gray-100 mb-4">角色管理</h3>
              <p className="text-gray-400 leading-relaxed">
                買家、管理者、員工三角色權限分離，各司其職，安全高效。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-gray-100 mb-8">
            準備好開始了嗎？
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            加入我們的系統，體驗現代化的洗衣與物流管理。
          </p>
          {!user && (
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold px-12 py-6 text-lg"
            >
              立即登入
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center text-gray-500 text-sm">
          <p>© 2026 Laundry Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
