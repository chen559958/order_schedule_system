import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const PROGRESS_LABELS: Record<string, string> = {
  pending: "尚未收件",
  received: "已收件",
  washing: "清洗中",
  returning: "準備送回",
  completed: "完成",
};

const PROGRESS_OPTIONS = [
  { value: "received", label: "已收件" },
  { value: "washing", label: "清洗中" },
  { value: "returning", label: "準備送回" },
  { value: "completed", label: "完成" },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [selectedOrderForComplete, setSelectedOrderForComplete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);

  // 獲取待處理訂單
  const { data: pendingOrdersData, isLoading: ordersLoading, refetch } = trpc.order.getPending.useQuery();

  // 完成訂單的 mutation
  const completeOrderMutation = trpc.schedule.completeOrder.useMutation({
    onSuccess: (_, variables) => {
      // 從待處理訂單中移除
      setPendingOrders(pendingOrders.filter(order => order.id !== variables.orderId));
      // 重新獲取待處理訂單列表
      refetch();
      // 導航到營業概況頁面
      setTimeout(() => {
        setLocation("/admin/business");
      }, 500);
    },
  });

  // 更新進度的 mutation
  const updateProgressMutation = trpc.order.updateProgress.useMutation({
    onSuccess: () => {
      setShowProgressDialog(false);
      setSelectedOrderId(null);
      // 重新獲取待處理訂單列表
      refetch();
    },
  });

  // 初始化待處理訂單
  useEffect(() => {
    if (pendingOrdersData) {
      setPendingOrders(pendingOrdersData);
      setFilteredOrders(pendingOrdersData);
      setIsLoadingOrders(false);
    }
  }, [pendingOrdersData]);

  // 搜尋功能
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(pendingOrders);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = pendingOrders.filter((order: any) => {
      const orderNumber = order.orderNumber || "";
      const customerName = order.customerName || "";
      const customerPhone = order.customerPhone || "";

      return (
        orderNumber.toLowerCase().includes(query) ||
        customerName.toLowerCase().includes(query) ||
        customerPhone.toLowerCase().includes(query)
      );
    });
    setFilteredOrders(filtered);
  }, [searchQuery, pendingOrders]);

  // 自動更新機制 - 每 5 秒重新獲取待處理訂單
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000); // 5 秒

    return () => clearInterval(interval);
  }, [refetch]);

  const handleProgressClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowProgressDialog(true);
  };

  const handleProgressSelect = (progress: string) => {
    if (selectedOrderId) {
      if (progress === "completed") {
        // 如果選擇「完成」，先顯示確認視窗
        const order = pendingOrders.find(o => o.id === selectedOrderId);
        setSelectedOrderForComplete(order);
        setShowProgressDialog(false);
        setShowCompleteConfirm(true);
      } else {
        // 其他進度直接更新
        updateProgressMutation.mutate({
          orderId: selectedOrderId,
          progress: progress as any,
        });
      }
    }
  };

  const confirmCompleteOrder = () => {
    if (selectedOrderForComplete) {
      // 先更新進度為 completed
      updateProgressMutation.mutate({
        orderId: selectedOrderForComplete.id,
        progress: "completed" as any,
      });
      // 然後完成訂單
      completeOrderMutation.mutate({ orderId: selectedOrderForComplete.id });
      setShowCompleteConfirm(false);
      setSelectedOrderForComplete(null);
    }
  };

  // 直接使用資料庫中的 orderNumber
  const getOrderNumber = (order: any): string => {
    return order.orderNumber || "未知編號";
  };

  const getCategoryLabel = (deliveryType: string) => {
    const labels: Record<string, string> = {
      pickup: "到府收送 - 收件",
      delivery: "到府收送 - 送回",
      self: "自行送件",
    };
    return labels[deliveryType] || deliveryType;
  };

  const getProgressColor = (progress: string) => {
    const colors: Record<string, string> = {
      pending: "bg-gray-600 hover:bg-gray-700",
      received: "bg-blue-600 hover:bg-blue-700",
      washing: "bg-yellow-600 hover:bg-yellow-700",
      returning: "bg-orange-600 hover:bg-orange-700",
      completed: "bg-green-600 hover:bg-green-700",
    };
    return colors[progress] || "bg-gray-600 hover:bg-gray-700";
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
            <span className="ml-4 text-xs text-gray-500">
              {ordersLoading ? "更新中..." : "已同步"}
            </span>
          </p>
        </div>

        {/* 搜尋框 */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="搜尋訂單編號、客戶姓名或電話..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
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
                      <th className="text-left py-2 px-4">袋數</th>
                      <th className="text-left py-2 px-4">支付方式</th>
                      <th className="text-left py-2 px-4">備註</th>
                      <th className="text-left py-2 px-4">進度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order: any) => {
                      const orderNumber = getOrderNumber(order);
                      const paymentLabels: Record<string, string> = {
                        cash: "現金",
                        credit_card: "信用卡",
                        line_pay: "LINE Pay",
                        points: "點數",
                      };
                      const currentProgress = order.progress || "pending";
                      return (
                        <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-800">
                          <td className="py-2 px-4 font-semibold">
                            <button
                              onClick={() => setLocation(`/order/${orderNumber}`)}
                              className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                            >
                              {orderNumber}
                            </button>
                          </td>
                          <td className="py-2 px-4">{order.customerName || "未知客戶"}</td>
                          <td className="py-2 px-4">{order.bagCount} 袋</td>
                          <td className="py-2 px-4">{paymentLabels[order.paymentMethod] || order.paymentMethod}</td>
                          <td className="py-2 px-4 text-gray-400 max-w-xs truncate">{order.notes || "無"}</td>
                          <td className="py-2 px-4">
                            <Button
                              size="sm"
                              className={`${getProgressColor(currentProgress)} text-white`}
                              onClick={() => handleProgressClick(order.id)}
                              disabled={updateProgressMutation.isPending || completeOrderMutation.isPending}
                            >
                              {PROGRESS_LABELS[currentProgress] || "尚未收件"}
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

      {/* 進度選擇彈跳視窗 */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">選擇訂單進度</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {PROGRESS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onClick={() => handleProgressSelect(option.value)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white justify-start"
                disabled={updateProgressMutation.isPending}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowProgressDialog(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 完成訂單確認彈跳視窗 */}
      <Dialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              確認該訂單（{selectedOrderForComplete?.orderNumber}）已完成？
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              onClick={() => setShowCompleteConfirm(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              否
            </Button>
            <Button
              onClick={confirmCompleteOrder}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={completeOrderMutation.isPending || updateProgressMutation.isPending}
            >
              是
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
