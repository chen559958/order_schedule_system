import { useMemo } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function CustomerHistory() {
  const { user } = useAuth();

  // 獲取當前用戶的所有訂單
  const { data: allOrders = [], isLoading } = trpc.order.getAll.useQuery();

  // 篩選出已完成或過去的訂單
  const historyOrders = useMemo(() => {
    return allOrders.filter((order: any) => {
      // 確保訂單屬於當前用戶
      if (order.customerId !== user?.id) return false;
      // 篩選出已完成的訂單
      return order.status === "completed";
    });
  }, [allOrders, user?.id]);

  const getDeliveryLabel = (deliveryType: string) => {
    const labels: Record<string, string> = {
      pickup: "到府收送 - 收件",
      delivery: "到府收送 - 送回",
      self: "自行送件",
    };
    return labels[deliveryType] || deliveryType;
  };

  const getPaymentLabel = (paymentMethod: string) => {
    const labels: Record<string, string> = {
      cash: "現金",
      mobile: "行動支付",
    };
    return labels[paymentMethod] || paymentMethod;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "未設定";
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* 頁面標題 */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">歷史訂單</h1>
          <p className="text-gray-600">查看您的所有已完成訂單</p>
        </div>

        {/* 訂單列表 */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">已完成訂單</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-gray-500">載入中...</div>
            ) : historyOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>目前沒有已完成的訂單</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">下單日期</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">訂單內容</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">袋數</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">支付方式</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">完成日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyOrders.map((order: any) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{formatDate(order.createdAt)}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {getDeliveryLabel(order.deliveryType)}
                        </td>
                        <td className="py-3 px-4 text-gray-700">{order.bagCount}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {getPaymentLabel(order.paymentMethod)}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {order.completedAt ? formatDate(order.completedAt) : "未設定"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}
