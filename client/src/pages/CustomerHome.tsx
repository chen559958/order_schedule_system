import { useMemo } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function CustomerHome() {
  const { user } = useAuth();

  // 獲取當前用戶的訂單
  const { data: myOrders = [], isLoading } = trpc.order.getMyOrders.useQuery();

  // 篩選出進行中/待處理的訂單
  const pendingOrders = useMemo(() => {
    return myOrders.filter((order: any) => {
      // 篩選出狀態為 pending 或 scheduled 的訂單（非 completed）
      return order.orderStatus === "pending" || order.orderStatus === "scheduled";
    });
  }, [myOrders]);

  // 生成訂單編號 (MMDD-NN 格式)
  const generateOrderNumber = (createdAt: string, index: number) => {
    const date = new Date(createdAt);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const sequence = String(index + 1).padStart(2, "0");
    return `${month}${day}-${sequence}`;
  };

  const getDeliveryLabel = (deliveryType: string) => {
    const labels: Record<string, string> = {
      pickup: "到府收送",
      delivery: "到府收送",
      self: "自行送件",
    };
    return labels[deliveryType] || deliveryType;
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
        {/* 歡迎語 - 大字顯示 */}
        <div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            歡迎，{user?.name || "使用者"}
          </h1>
          <p className="text-gray-600 text-lg">查看您的訂單狀態和進度</p>
        </div>

        {/* 當前訂單列表 */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">進行中的訂單</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">載入中...</p>
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium">目前沒有進行中的訂單</p>
                <p className="text-sm mt-2">點擊側邊欄「新增訂單」建立新訂單</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order: any, index: number) => {
                  const orderNumber = generateOrderNumber(order.createdAt, index);
                  return (
                    <div
                      key={order.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500">訂單編號</p>
                          <p className="text-lg font-bold text-gray-900">{orderNumber}</p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {order.orderStatus === "pending" ? "待處理" : "已排程"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">訂單內容</p>
                          <p className="text-gray-900 font-medium">{order.bagCount} 袋 {getDeliveryLabel(order.deliveryType)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">下單日期</p>
                          <p className="text-gray-900 font-medium">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>

                      {order.estimatedCompletion && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800">
                            <span className="font-semibold">預計完成日期：</span>
                            {formatDate(order.estimatedCompletion)}
                          </p>
                        </div>
                      )}

                      {order.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">備註：{order.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}
