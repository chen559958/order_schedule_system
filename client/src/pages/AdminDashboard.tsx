import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Layout } from "@/components/Layout";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("schedule");

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <Layout pageTitle="管理後台">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">今日訂單</div>
          <div className="text-3xl font-bold text-slate-900">12</div>
          <div className="text-xs text-gray-500 mt-2">比昨日增加 20%</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">待處理預約</div>
          <div className="text-3xl font-bold text-slate-900">5</div>
          <div className="text-xs text-gray-500 mt-2">需要安排時間</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">本月總額</div>
          <div className="text-3xl font-bold text-slate-900">NT$45,000</div>
          <div className="text-xs text-gray-500 mt-2">已收款 85%</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">活躍客戶</div>
          <div className="text-3xl font-bold text-slate-900">28</div>
          <div className="text-xs text-gray-500 mt-2">本月新增 3 位</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-slate-900">當日排程</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">客戶名稱</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">地址</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">電話</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">袋數</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">狀態</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">王小明</td>
                <td className="px-6 py-4 text-sm text-gray-600">台北市信義區</td>
                <td className="px-6 py-4 text-sm text-gray-600">0912-345-678</td>
                <td className="px-6 py-4 text-sm text-gray-600">3</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    待取件
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-blue-600 hover:text-blue-800 font-medium">編輯</button>
                </td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">李小華</td>
                <td className="px-6 py-4 text-sm text-gray-600">台北市中山區</td>
                <td className="px-6 py-4 text-sm text-gray-600">0912-345-679</td>
                <td className="px-6 py-4 text-sm text-gray-600">2</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    已完成
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-blue-600 hover:text-blue-800 font-medium">編輯</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
