import { useState, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function AdminCustomers() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 獲取所有客戶
  const { data: customers = [], isLoading: customersLoading } = trpc.adminCustomer.getAll.useQuery();

  // 搜尋篩選客戶
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter((customer: any) => 
      customer.fullName.toLowerCase().includes(query) ||
      customer.phone.includes(query)
    );
  }, [customers, searchQuery]);

  // 獲取選定客戶的訂單歷史
  const { data: customerOrderHistory = [] } = trpc.adminCustomer.getOrderHistory.useQuery(
    { customerId: selectedCustomerId || 0 },
    { enabled: selectedCustomerId !== null }
  );

  // 獲取選定的客戶詳情
  const selectedCustomer = useMemo(() => {
    return customers.find((c: any) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // 計算客戶的訂單統計
  const customerStats = useMemo(() => {
    if (!customerOrderHistory) return { orderCount: 0, totalAmount: 0 };
    return {
      orderCount: customerOrderHistory.length,
      totalAmount: customerOrderHistory.reduce((sum: number, order: any) => {
        return sum + (order.bagCount * 150);
      }, 0),
    };
  }, [customerOrderHistory]);

  const getCategoryLabel = (deliveryType: string) => {
    const labels: Record<string, string> = {
      pickup: "到府收送 - 收件",
      delivery: "到府收送 - 送回",
      self: "自行送件",
    };
    return labels[deliveryType] || deliveryType;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">會員資料</h1>
          <p className="text-gray-400">查看和管理客戶信息</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 會員列表 */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">會員列表</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 搜尋框 */}
                <input
                  type="text"
                  placeholder="按姓名或電話搜尋..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                {customersLoading ? (
                  <div className="text-gray-400">載入中...</div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-gray-400">暫無會員</div>
                ) : (
                  <div className="space-y-2">
                    {filteredCustomers.map((customer: any) => (
                      <button
                        key={customer.id}
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedCustomerId === customer.id
                            ? "bg-blue-900 text-white"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        <p className="font-semibold">{customer.fullName}</p>
                        <p className="text-xs text-gray-400">{customer.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 會員詳情與歷史訂單 */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCustomer ? (
              <>
                {/* 會員詳情 */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">會員詳情</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm">姓名</p>
                      <p className="text-white text-lg font-semibold">
                        {selectedCustomer.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">電話</p>
                      <p className="text-white">{selectedCustomer.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">地址</p>
                      <p className="text-white">{selectedCustomer.address}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">訂單數</p>
                      <p className="text-white text-lg font-semibold">
                        {customerStats.orderCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">總消費金額</p>
                      <p className="text-white text-lg font-semibold">
                        NT${customerStats.totalAmount}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 歷史訂單 */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">歷史訂單</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customerOrderHistory.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        該客戶暫無訂單
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-800">
                              <th className="text-left py-3 px-4 text-gray-400">日期</th>
                              <th className="text-left py-3 px-4 text-gray-400">送件方式</th>
                              <th className="text-left py-3 px-4 text-gray-400">袋數</th>
                              <th className="text-left py-3 px-4 text-gray-400">金額</th>
                              <th className="text-left py-3 px-4 text-gray-400">狀態</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerOrderHistory.map((order: any) => (
                              <tr
                                key={order.id}
                                className="border-b border-gray-800 hover:bg-gray-800/50"
                              >
                                <td className="py-3 px-4 text-white">
                                  {order.createdAt?.split(' ')[0] || order.createdAt?.split('T')[0] || '未知'}
                                </td>
                                <td className="py-3 px-4 text-gray-300">
                                  {getCategoryLabel(order.deliveryType)}
                                </td>
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
                                    {order.status === "completed" ? "已完成" : "待處理"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">請選擇一個會員查看詳情</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
