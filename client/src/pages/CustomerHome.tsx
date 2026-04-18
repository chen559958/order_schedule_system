import { useMemo } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function CustomerHome() {
  const { user } = useAuth();

  // 獲取當前用戶的所有訂單
  const { data: allOrders = [], isLoading } = trpc.order.getAll.useQuery();

  // 篩選出尚未完成的訂單
  const pendingOrders = useMemo(() => {
    return allOrders.filter((order: any) => {
      // 確保訂單屬於當前用戶
      if (order.customerId !== user?.id) return false;
      // 篩選出尚未完成的訂單
      return order.status === "pending" || order.status !== "completed";
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
        {/* 歡迎語 */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            歡迎，{user?.name || "使用者"}
          </h1>
          <p className="text-gray-600">查看您的訂單狀態和進度</p>
        </div>

        {/* 當前訂單列表 */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">當前訂單</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-gray-500">載入中...</div>
            ) : pendingOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>目前沒有待處理的訂單</p>
                <p className="text-sm mt-2">點擊側邊欄「新增訂單」建立新訂單</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* 訂單內容 */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">訂單內容</p>
                        <p className="font-semibold text-gray-900">
                          {getDeliveryLabel(order.deliveryType)}
                        </p>
                        <p className="text-sm text-gray-600">{order.bagCount} 袋</p>
                      </div>

                      {/* 下單日期 */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">下單日期</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      {/* 預計完成日期 */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">預計完成日期</p>
                        <p className="font-semibold text-gray-900">
                          {order.estimatedCompletionDate
                            ? formatDate(order.estimatedCompletionDate)
                            : "未設定"}
                        </p>
                      </div>

                      {/* 狀態 */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">狀態</p>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          待處理
                        </span>
                      </div>
                    </div>

                    {/* 備註 */}
                    {order.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">備註</p>
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
