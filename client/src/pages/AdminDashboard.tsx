import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // 獲取所有訂單
  const { data: allOrders, isLoading: ordersLoading } = trpc.order.getAll.useQuery();

  // 完成訂單的 mutation
  const completeOrderMutation = trpc.schedule.completeOrder.useMutation({
    onSuccess: (_, variables) => {
      // 從待處理訂單中移除
      setPendingOrders(pendingOrders.filter(order => order.id !== variables.orderId));
    },
  });

  // 初始化待處理訂單
  useEffect(() => {
    if (allOrders) {
      const pending = allOrders.filter((order: any) => order.status !== 'completed');
      setPendingOrders(pending);
      setIsLoadingOrders(false);
    }
  }, [allOrders]);

  const handleCompleteOrder = (orderId: number) => {
    completeOrderMutation.mutate({ orderId });
  };

  // 生成訂單編號
  const generateOrderNumber = (order: any, index: number): string => {
    const createdAt = order.createdAt;
    let dateStr = "";
    
    if (typeof createdAt === "string") {
      // 提取日期部分
      const datePart = createdAt.split(" ")[0] || createdAt.split("T")[0];
      const [year, month, day] = datePart.split("-");
      dateStr = `${month}${day}`;
    } else if (createdAt instanceof Date) {
      const month = String(createdAt.getMonth() + 1).padStart(2, "0");
      const day = String(createdAt.getDate()).padStart(2, "0");
      dateStr = `${month}${day}`;
    }

    // 當日第幾單（從 01 開始）
    const orderCount = String(index + 1).padStart(2, "0");
    return `${dateStr}-${orderCount}`;
  };

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
          <h1 className="text-4xl font-bold text-white mb-2">管理後台</h1>
          <p className="text-gray-400">
            {new Date().toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* 待處理訂單 */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">待處理訂單</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="text-gray-400">載入中...</div>
            ) : pendingOrders.length === 0 ? (
              <div className="text-gray-400">沒有待處理訂單</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-300">
                  <thead className="border-b border-gray-700">
                    <tr>
                      <th className="text-left py-2 px-4">訂單編號</th>
                      <th className="text-left py-2 px-4">客戶姓名</th>
                      <th className="text-left py-2 px-4">訂單內容</th>
                      <th className="text-left py-2 px-4">聯絡電話</th>
                      <th className="text-left py-2 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map((order: any, index: number) => {
                      const orderNumber = generateOrderNumber(order, index);
                      return (
                        <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-800">
                          <td className="py-2 px-4 font-semibold text-blue-400">{orderNumber}</td>
                          <td className="py-2 px-4">{order.customerName || "未知客戶"}</td>
                          <td className="py-2 px-4">
                            {getCategoryLabel(order.deliveryType)} {order.bagCount} 袋
                          </td>
                          <td className="py-2 px-4">{order.customerPhone || "未提供"}</td>
                          <td className="py-2 px-4">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleCompleteOrder(order.id)}
                              disabled={completeOrderMutation.isPending}
                            >
                              {completeOrderMutation.isPending ? "處理中..." : "完成"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
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
