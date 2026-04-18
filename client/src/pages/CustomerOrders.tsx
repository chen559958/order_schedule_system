import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Layout } from "@/components/Layout";

export default function CustomerOrders() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([
    {
      id: 1,
      date: "2026-04-18",
      bags: 3,
      amount: 450,
      status: "待取件",
      deliveryMethod: "門到門",
    },
    {
      id: 2,
      date: "2026-04-15",
      bags: 2,
      amount: 300,
      status: "已完成",
      deliveryMethod: "自取",
    },
  ]);

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <Layout pageTitle="我的訂單">
      {activeTab === "orders" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-8 flex items-center justify-center cursor-pointer hover:shadow-lg transition">
              <div className="text-center">
                <div className="text-4xl mb-3">+</div>
                <p className="text-lg font-semibold text-blue-900">新增訂單</p>
                <p className="text-sm text-blue-700 mt-1">點擊建立新訂單</p>
              </div>
            </div>

            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">訂單編號</p>
                    <p className="text-lg font-semibold text-gray-900">#{order.id}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === "已完成"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600">訂單日期</span>
                    <span className="font-medium text-gray-900">{order.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">袋數</span>
                    <span className="font-medium text-gray-900">{order.bags} 袋</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">金額</span>
                    <span className="font-medium text-gray-900">NT${order.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">配送方式</span>
                    <span className="font-medium text-gray-900">{order.deliveryMethod}</span>
                  </div>
                </div>

                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                  查看詳情
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">總訂單數</p>
              <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">總金額</p>
              <p className="text-3xl font-bold text-gray-900">NT${orders.reduce((sum, o) => sum + o.amount, 0)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">總袋數</p>
              <p className="text-3xl font-bold text-gray-900">{orders.reduce((sum, o) => sum + o.bags, 0)} 袋</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "new-order" && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">新增訂單</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">袋數</label>
                <input
                  type="number"
                  placeholder="請輸入袋數"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">送貨方式</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>到府收件</option>
                  <option>到府送回</option>
                  <option>自行送件</option>
                </select>
              </div>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                提交訂單
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">預約排程</h3>
          <div className="text-center py-12 text-gray-500">
            暫無排程
          </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">個人資訊</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">姓名</p>
                <p className="text-lg font-medium text-gray-900">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
