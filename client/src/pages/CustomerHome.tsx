import { useMemo } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const PROGRESS_LABELS: Record<string, string> = {
  pending: "尚未收件",
  received: "已收件",
  washing: "清洗中",
  returning: "準備送回",
  completed: "完成",
};

const PROGRESS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  received: "bg-blue-100 text-blue-800",
  washing: "bg-yellow-100 text-yellow-800",
  returning: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
};

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

  // 直接使用資料庫中的 orderNumber
  const getOrderNumber = (order: any): string => {
    return order.orderNumber || "未知編號";
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

  const getProgressIcon = (progress: string) => {
    const icons: Record<string, string> = {
      pending: "⏳",
      received: "✓",
      washing: "🔄",
      returning: "→",
      completed: "✓",
    };
    return icons[progress] || "•";
  };

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* 歡迎語 - 大字顯示 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
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
                {pendingOrders.map((order: any) => {
                  const orderNumber = getOrderNumber(order);
                  const progress = order.progress || "pending";
                  const progressLabel = PROGRESS_LABELS[progress] || "尚未收件";
                  const progressColor = PROGRESS_COLORS[progress] || "bg-gray-100 text-gray-800";
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
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">進度</p>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${progressColor}`}>
                            {getProgressIcon(progress)} {progressLabel}
                          </span>
                        </div>
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

                      {/* 進度詳情 */}
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">當前進度：</span>
                          {progress === "completed" && "✓ 已完成"}
                          {progress === "returning" && "→ 準備送回"}
                          {progress === "washing" && "🔄 清洗中"}
                          {progress === "received" && "✓ 已收件"}
                          {progress === "pending" && "⏳ 尚未收件"}
                        </p>
                      </div>

                      {order.estimatedCompletion && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
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
