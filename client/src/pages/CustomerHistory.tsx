import { useMemo } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function CustomerHistory() {
  const { user } = useAuth();

  // 獲取當前用戶的訂單
  const { data: myOrders = [], isLoading } = trpc.order.getMyOrders.useQuery();

  // 篩選出已完成 (COMPLETED) 的訂單
  const historyOrders = useMemo(() => {
    return myOrders.filter((order: any) => {
      // 篩選出已完成的訂單
      return order.status === "completed";
    });
  }, [myOrders]);

  const getDeliveryLabel = (deliveryType: string) => {
    const labels: Record<string, string> = {
      pickup: "到府收送",
      delivery: "到府收送",
      self: "自行送件",
    };
    return labels[deliveryType] || deliveryType;
  };

  const getOrderNumber = (order: any): string => {
    return order.orderNumber || "未知編號";
  };

  const getPaymentLabel = (paymentMethod: string) => {
    const labels: Record<string, string> = {
      cash: "現金",
      credit_card: "信用卡",
      line_pay: "LINE Pay",
      points: "點數",
    };
    return labels[paymentMethod] || paymentMethod;
  };

  const formatDate = (dateString: string | null | undefined) => {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">歷史訂單</h1>
          <p className="text-gray-600 text-lg">查看您的所有已完成訂單</p>
        </div>

        {/* 訂單列表 */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">已完成訂單</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">載入中...</p>
              </div>
            ) : historyOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium">目前沒有已完成的訂單</p>
                <p className="text-sm mt-2">完成的訂單將顯示在此</p>
              </div>
            ) : (
              <div className="space-y-4">
                {historyOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                      {/* 訂單編號 */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-semibold">訂單編號</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {getOrderNumber(order)}
                        </p>
                      </div>

                      {/* 下單日期 */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-semibold">下單日期</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      {/* 訂單內容 */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-semibold">訂單內容</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {getDeliveryLabel(order.deliveryType)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{order.bagCount} 袋</p>
                      </div>

                      {/* 支付方式 */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-semibold">支付方式</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {getPaymentLabel(order.paymentMethod)}
                        </p>
                      </div>

                      {/* 完成日期 */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-semibold">完成日期</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatDate(order.completedAt)}
                        </p>
                      </div>

                      {/* 狀態徽章 */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-semibold">狀態</p>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          已完成
                        </span>
                      </div>
                    </div>

                    {/* 備註 */}
                    {order.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2 font-semibold">備註</p>
                        <p className="text-sm text-gray-700">{order.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}
