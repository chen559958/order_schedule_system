import { useState, useEffect } from "react";
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
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // 獲取待處理訂單
  const { data: pendingOrdersData, isLoading: ordersLoading, refetch } = trpc.order.getPending.useQuery();

  // 獲取當日排程
  const { data: todaySchedules, isLoading: schedulesLoading } = trpc.schedule.getTodaySchedules.useQuery();
  const { data: allOrders } = trpc.order.getAll.useQuery();

  // 完成訂單的 mutation
  const completeOrderMutation = trpc.schedule.completeOrder.useMutation({
    onSuccess: (_, variables) => {
      console.log("[DEBUG] completeOrder onSuccess called with orderId:", variables.orderId);
      // 從待處理訂單中移除
      const updatedOrders = pendingOrders.filter(order => order.id !== variables.orderId);
      console.log("[DEBUG] Updated orders after filter:", updatedOrders);
      setPendingOrders(updatedOrders);
      setFilteredOrders(updatedOrders);
      // 重新獲取待處理訂單列表
      console.log("[DEBUG] Calling refetch...");
      refetch();
      // 停留在首頁，不跳轉
      setShowCompleteConfirm(false);
    },
    onError: (error) => {
      console.error("[ERROR] completeOrder failed:", error);
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

  const handleProgressClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    const order = filteredOrders.find(o => o.id === orderId);
    setSelectedOrder(order);
    setShowProgressDialog(true);
  };

  const handleProgressSelect = (progress: string) => {
    if (selectedOrderId) {
      console.log("[DEBUG] handleProgressSelect called with progress:", progress);
      if (progress === 'completed') {
        // 如果選擇完成，先顯示確認對話框
        console.log("[DEBUG] Showing complete confirmation for orderId:", selectedOrderId);
        setShowProgressDialog(false);
        setSelectedOrderForComplete(selectedOrder);
        setShowCompleteConfirm(true);
      } else {
        // 其他進度選擇使用 updateProgressMutation
        updateProgressMutation.mutate({
          orderId: selectedOrderId,
          progress: progress as any,
        });
      }
    }
  };

  const handleCompleteClick = (order: any) => {
    setSelectedOrderForComplete(order);
    setShowCompleteConfirm(true);
  };

  const confirmCompleteOrder = () => {
    if (selectedOrderForComplete) {
      console.log("[DEBUG] Confirming complete order:", selectedOrderForComplete.id);
      setShowCompleteConfirm(false);
      completeOrderMutation.mutate({
        orderId: selectedOrderForComplete.id,
      });
    }
  };

  const getProgressColor = (progress: string) => {
    const colors: Record<string, string> = {
      pending: "bg-gray-600",
      received: "bg-blue-600",
      washing: "bg-yellow-600",
      returning: "bg-purple-600",
      completed: "bg-green-600",
    };
    return colors[progress] || "bg-gray-600";
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 搜尋欄 */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <input
            type="text"
            placeholder="搜尋訂單編號、客戶姓名或電話..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 待處理訂單列表 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">待處理訂單</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="text-gray-400">載入中...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-gray-400">無待處理訂單</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-2 px-4 text-left text-gray-400">訂單編號</th>
                      <th className="py-2 px-4 text-left text-gray-400">客戶姓名</th>
                      <th className="py-2 px-4 text-left text-gray-400">聯絡電話</th>
                      <th className="py-2 px-4 text-left text-gray-400">袋數</th>
                      <th className="py-2 px-4 text-left text-gray-400">備註</th>
                      <th className="py-2 px-4 text-left text-gray-400">進度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order: any) => {
                      const currentProgress = order.progress || "pending";
                      return (
                        <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="py-2 px-4 font-semibold">
                            <button
                              onClick={() => setLocation(`/order/${order.orderNumber}`)}
                              className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                            >
                              {order.orderNumber}
                            </button>
                          </td>
                          <td className="py-2 px-4 text-gray-400">{order.customerName}</td>
                          <td className="py-2 px-4 text-gray-400">{order.customerPhone}</td>
                          <td className="py-2 px-4 text-gray-400">{order.bagCount}</td>
                          <td className="py-2 px-4 text-gray-400">{PROGRESS_LABELS[currentProgress]}</td>
                          <td className="py-2 px-4 text-gray-400 max-w-xs truncate">{order.notes || "無"}</td>
                          <td className="py-2 px-4">
                            <Button
                              size="sm"
                              className={`${getProgressColor(currentProgress)} text-white`}
                              onClick={() => handleProgressClick(order.id)}
                              disabled={updateProgressMutation.isPending || completeOrderMutation.isPending}
                            >
                              {PROGRESS_LABELS[currentProgress]}
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

        {/* 當日排程 */}
        {todaySchedules && todaySchedules.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">當日排程</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* 到府收送 */}
                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="text-white font-semibold mb-3">到府收送</h3>
                  <div className="space-y-2">
                    {todaySchedules
                      .filter((s: any) => s.pickupType === "pickup")
                      .map((schedule: any) => {
                        const order = allOrders?.find((o: any) => o.id === schedule.orderId);
                        return (
                          <div key={schedule.id} className="bg-gray-600 p-2 rounded text-gray-200 text-sm">
                            <p className="font-semibold">{order?.customerName}</p>
                            <p>{order?.customerAddress}</p>
                            <p className="text-xs text-gray-400">{schedule.scheduledTime}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* 自行送件 */}
                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="text-white font-semibold mb-3">自行送件</h3>
                  <div className="space-y-2">
                    {todaySchedules
                      .filter((s: any) => s.pickupType === "selfPickup")
                      .map((schedule: any) => {
                        const order = allOrders?.find((o: any) => o.id === schedule.orderId);
                        return (
                          <div key={schedule.id} className="bg-gray-600 p-2 rounded text-gray-200 text-sm">
                            <p className="font-semibold">{order?.customerName}</p>
                            <p>{order?.customerAddress}</p>
                            <p className="text-xs text-gray-400">{schedule.scheduledTime}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 訂單詳情對話框 */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">訂單詳情 - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 訂單照片 */}
            {selectedOrder?.orderPhotos && selectedOrder.orderPhotos.length > 0 && (
              <div className="bg-gray-800 p-3 rounded">
                <p className="text-gray-400 text-sm mb-2">訂單照片</p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedOrder.orderPhotos.map((photo: any, index: number) => (
                    <img
                      key={index}
                      src={photo.photoUrl}
                      alt={`訂單照片 ${index + 1}`}
                      className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* 進度選擇 */}
            <div>
              <p className="text-gray-400 text-sm mb-2">選擇訂單進度</p>
              <div className="space-y-2">
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
            </div>
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
