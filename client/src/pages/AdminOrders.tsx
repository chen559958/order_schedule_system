import { useState, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

export default function AdminOrders() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // 獲取所有訂單
  const { data: allOrders = [], isLoading } = trpc.order.getAll.useQuery();

  // 在前端進行日期篩選
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order: any) => {
      if (!order.createdAt) return false;
      // 提取日期部分進行比較
      const orderDate = order.createdAt.split(' ')[0] || order.createdAt.split('T')[0];
      return orderDate === selectedDate;
    });
  }, [allOrders, selectedDate]);

  // 計算統計信息
  const stats = {
    totalOrders: filteredOrders.length,
    totalAmount: filteredOrders.reduce((sum: number, order: any) => {
      // 根據送件方式估算金額（每袋150元）
      return sum + (order.bagCount * 150);
    }, 0),
    totalBags: filteredOrders.reduce((sum: number, order: any) => sum + order.bagCount, 0),
  };

  const getCategoryLabel = (deliveryType: string) => {
    const labels: Record<string, string> = {
      pickup: "到府收送 - 收件",
      delivery: "到府收送 - 送回",
      self: "自行送件",
    };
    return labels[deliveryType] || deliveryType;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "待處理",
      completed: "已完成",
    };
    return labels[status] || status;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">訂單概況</h1>
          <p className="text-gray-400">查看和管理所有訂單</p>
        </div>

        {/* 日期選擇器 */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">篩選</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-2">選擇日期</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 統計信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <p className="text-gray-400 text-sm mb-2">訂單數量</p>
              <p className="text-3xl font-bold text-white">{stats.totalOrders}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <p className="text-gray-400 text-sm mb-2">總金額</p>
              <p className="text-3xl font-bold text-white">NT${stats.totalAmount}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <p className="text-gray-400 text-sm mb-2">總袋數</p>
              <p className="text-3xl font-bold text-white">{stats.totalBags}</p>
            </CardContent>
          </Card>
        </div>

        {/* 訂單列表 */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">訂單列表</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-gray-400">載入中...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 text-gray-400">客戶姓名</th>
                      <th className="text-left py-3 px-4 text-gray-400">送件方式</th>
                      <th className="text-left py-3 px-4 text-gray-400">袋數</th>
                      <th className="text-left py-3 px-4 text-gray-400">金額</th>
                      <th className="text-left py-3 px-4 text-gray-400">狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          該日期暫無訂單
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order: any) => (
                        <tr key={order.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="py-3 px-4 text-white">{order.customerName || "未知客戶"}</td>
                          <td className="py-3 px-4 text-gray-300">{getCategoryLabel(order.deliveryType)}</td>
                          <td className="py-3 px-4 text-gray-300">{order.bagCount}</td>
                          <td className="py-3 px-4 text-gray-300">NT${order.bagCount * 150}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order.status === "completed"
                                  ? "bg-green-900 text-green-200"
                                  : "bg-yellow-900 text-yellow-200"
                              }`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
