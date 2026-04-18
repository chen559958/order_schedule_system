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
import { Input } from "@/components/ui/input";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [orderScheduleDates, setOrderScheduleDates] = useState<Record<number, string>>({});
  const [displayDate, setDisplayDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // 獲取所有訂單
  const { data: allOrders, isLoading: ordersLoading } = trpc.order.getAll.useQuery();
  
  // 獲取當日排程
  const { data: todaySchedules, isLoading: schedulesLoading } = trpc.schedule.getTodaySchedules.useQuery();

  // 獲取所有排程（用於加載訂單日期）
  const { data: allSchedules, isLoading: allSchedulesLoading } = trpc.schedule.getAllSchedules.useQuery();

  // 完成訂單的 mutation
  const completeOrderMutation = trpc.schedule.completeOrder.useMutation({
    onSuccess: (_, variables) => {
      // 從待處理訂單中移除
      setPendingOrders(pendingOrders.filter(order => order.id !== variables.orderId));
      // 從排程中移除
      setSchedules(schedules.filter(schedule => schedule.orderId !== variables.orderId));
      // 移除日期記錄
      const newDates = { ...orderScheduleDates };
      delete newDates[variables.orderId];
      setOrderScheduleDates(newDates);
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

  // 初始化當日排程
  useEffect(() => {
    if (todaySchedules) {
      const notCompleted = todaySchedules.filter((schedule: any) => !schedule.isCompleted);
      setSchedules(notCompleted);
      setIsLoadingSchedules(false);
    }
  }, [todaySchedules]);

  // 加載所有排程日期
  useEffect(() => {
    if (allSchedules) {
      const dates: Record<number, string> = {};
      allSchedules.forEach((schedule: any) => {
        if (schedule.scheduledDate) {
          const dateStr = schedule.scheduledDate.split(' ')[0] || schedule.scheduledDate.split('T')[0];
          dates[schedule.orderId] = dateStr;
        }
      });
      setOrderScheduleDates(dates);
    }
  }, [allSchedules]);

  // 更新排程日期的 mutation
  const updateScheduleDateMutation = trpc.schedule.updateScheduleDate.useMutation({
    onSuccess: (_, variables) => {
      // 更新本地日期記錄
      setOrderScheduleDates({
        ...orderScheduleDates,
        [variables.orderId]: variables.newDate,
      });
      // 關閉對話框
      setEditingOrderId(null);
      setSelectedDate("");
    },
  });

  const handleCompleteOrder = (orderId: number) => {
    completeOrderMutation.mutate({ orderId });
  };

  const handleEditDate = (orderId: number, currentDate?: string) => {
    setEditingOrderId(orderId);
    setSelectedDate(currentDate || new Date().toISOString().split('T')[0]);
  };

  const handleSaveDate = async () => {
    if (editingOrderId && selectedDate) {
      try {
        await updateScheduleDateMutation.mutateAsync({
          orderId: editingOrderId,
          newDate: selectedDate,
        });
      } catch (error) {
        console.error("更新排程失敗:", error);
      }
    }
  };

  // 根據 displayDate 篩選排程
  const filteredSchedules = useMemo(() => {
    console.log("篩選排程:", { displayDate, orderScheduleDates, pendingOrdersCount: pendingOrders.length });
    return pendingOrders
      .filter((order: any) => {
        const scheduledDate = orderScheduleDates[order.id];
        return scheduledDate === displayDate;
      })
      .map((order: any) => ({
        id: order.id,
        orderId: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        bagCount: order.bagCount,
        deliveryType: order.deliveryType,
        isCompleted: false,
      }));
  }, [pendingOrders, displayDate, orderScheduleDates]);

  const getCategoryLabel = (deliveryType: string) => {
    const labels: Record<string, string> = {
      pickup: "到府收送 - 收件",
      delivery: "到府收送 - 送回",
      self: "自行送件",
    };
    return labels[deliveryType] || deliveryType;
  };

  const getOrderScheduleDate = (orderId: number): string => {
    return orderScheduleDates[orderId] || "";
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">管理後台</h1>
          <p className="text-gray-400">
            {new Date(displayDate).toLocaleDateString("zh-TW", {
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
                      <th className="text-left py-2 px-4">客戶姓名</th>
                      <th className="text-left py-2 px-4">訂單內容</th>
                      <th className="text-left py-2 px-4">聯絡電話</th>
                      <th className="text-left py-2 px-4">日期</th>
                      <th className="text-left py-2 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map((order: any) => {
                      const orderDate = getOrderScheduleDate(order.id);
                      return (
                        <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-800">
                          <td className="py-2 px-4">{order.customerName || "未知客戶"}</td>
                          <td className="py-2 px-4">
                            {getCategoryLabel(order.deliveryType)} {order.bagCount} 袋
                          </td>
                          <td className="py-2 px-4">{order.customerPhone || "未提供"}</td>
                          <td className="py-2 px-4">
                            {orderDate ? (
                              <span className="text-white font-semibold">{orderDate}</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-400 border-blue-400 hover:bg-blue-900"
                                onClick={() => handleEditDate(order.id)}
                              >
                                編輯
                              </Button>
                            )}
                          </td>
                          <td className="py-2 px-4 space-x-2">
                            {orderDate && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-400 border-blue-400 hover:bg-blue-900"
                                onClick={() => handleEditDate(order.id, orderDate)}
                              >
                                修改
                              </Button>
                            )}
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

        {/* 當日排程 */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">當日排程</CardTitle>
              <Input
                type="date"
                value={displayDate}
                onChange={(e) => setDisplayDate(e.target.value)}
                className="w-32 bg-gray-800 border-gray-700 text-white text-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSchedules || allSchedulesLoading ? (
              <div className="text-gray-400">載入中...</div>
            ) : filteredSchedules.length === 0 ? (
              <div className="text-gray-400">沒有該日期的排程</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 到府收送 */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">到府收送</h3>
                  <div className="space-y-3">
                    {filteredSchedules
                      .filter((s: any) => s.deliveryType !== 'self')
                      .map((schedule: any) => (
                        <div
                          key={schedule.id}
                          className="bg-gray-800 p-4 rounded border border-gray-700"
                        >
                          <p className="text-white font-semibold">
                            {schedule.customerName || "未知客戶"}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {schedule.customerPhone || "未提供"}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {schedule.bagCount} 袋
                          </p>
                          <Button
                            size="sm"
                            className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleCompleteOrder(schedule.orderId)}
                          >
                            完成
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 自行送件 */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">自行送件</h3>
                  <div className="space-y-3">
                    {filteredSchedules
                      .filter((s: any) => s.deliveryType === 'self')
                      .map((schedule: any) => (
                        <div
                          key={schedule.id}
                          className="bg-gray-800 p-4 rounded border border-gray-700"
                        >
                          <p className="text-white font-semibold">
                            {schedule.customerName || "未知客戶"}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {schedule.customerPhone || "未提供"}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {schedule.bagCount} 袋
                          </p>
                          <Button
                            size="sm"
                            className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleCompleteOrder(schedule.orderId)}
                          >
                            完成
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 日期編輯對話框 */}
      <Dialog open={editingOrderId !== null} onOpenChange={(open) => !open && setEditingOrderId(null)}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">選擇排程日期</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingOrderId(null)}
              className="text-gray-300"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveDate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              確認
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
