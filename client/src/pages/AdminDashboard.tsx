import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const deliveryTypeLabels: Record<string, string> = {
  pickup: "到府收件",
  delivery: "到府送回",
  self: "自行送件",
};

const paymentMethodLabels: Record<string, string> = {
  cash: "現金",
  credit_card: "信用卡",
  line_pay: "LINE Pay",
  points: "點數扣款",
};

const paymentStatusLabels: Record<string, string> = {
  paid: "已付款",
  unpaid: "未付款",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [deliveryTimes, setDeliveryTimes] = useState<Record<number, string>>({});

  const { data: schedules, isLoading } = trpc.schedule.getTodaySchedules.useQuery();
  const { data: allOrders } = trpc.order.getAll.useQuery();
  const updateDeliveryTimeMutation = trpc.schedule.updateDeliveryTime.useMutation();
  const markCompletedMutation = trpc.schedule.markCompleted.useMutation();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  useEffect(() => {
    if (schedules && allOrders) {
      const enriched = schedules.map((schedule) => {
        const order = allOrders.find((o) => o.id === schedule.orderId);
        return { ...schedule, order };
      });
      setScheduleData(enriched);
    }
  }, [schedules, allOrders]);

  const handleUpdateDeliveryTime = async (scheduleId: number) => {
    const time = deliveryTimes[scheduleId];
    if (!time) {
      toast.error("請輸入送貨時間");
      return;
    }
    try {
      await updateDeliveryTimeMutation.mutateAsync({
        scheduleId,
        deliveryTime: time,
      });
      toast.success("送貨時間已更新");
    } catch (error) {
      toast.error("更新失敗");
    }
  };

  const handleMarkCompleted = async (scheduleId: number) => {
    try {
      await markCompletedMutation.mutateAsync({ scheduleId });
      toast.success("已標記為完成");
    } catch (error) {
      toast.error("標記失敗");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  const pickupSchedules = scheduleData.filter((s) => s.order?.deliveryType === "pickup");
  const deliverySchedules = scheduleData.filter((s) => s.order?.deliveryType === "delivery");
  const selfSchedules = scheduleData.filter((s) => s.order?.deliveryType === "self");

  const renderScheduleGroup = (title: string, schedules: any[]) => (
    <div className="mb-8">
      <h2 className="text-2xl font-black text-gray-100 mb-4">{title}</h2>
      {schedules.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-8 text-center text-gray-400">
            無排程
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules
            .sort((a, b) => {
              if (!a.deliveryTime || !b.deliveryTime) return 0;
              return a.deliveryTime.localeCompare(b.deliveryTime);
            })
            .map((schedule) => (
              <Card key={schedule.id} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-100">
                        {schedule.order?.customerId ? `客戶 #${schedule.order.customerId}` : "未知客戶"}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        訂單 #{schedule.orderId}
                      </CardDescription>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        checked={schedule.isCompleted}
                        onChange={() => handleMarkCompleted(schedule.id)}
                        className="w-6 h-6 cursor-pointer"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">袋數</p>
                      <p className="text-gray-100 font-bold">{schedule.order?.bagCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">付費方式</p>
                      <p className="text-gray-100 font-bold">
                        {paymentMethodLabels[schedule.order?.paymentMethod] || schedule.order?.paymentMethod}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">付款狀態</p>
                      <p className="text-gray-100 font-bold">
                        {paymentStatusLabels[schedule.order?.paymentStatus] || schedule.order?.paymentStatus}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <label className="text-gray-300 text-sm block mb-2">送貨時間</label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={deliveryTimes[schedule.id] || schedule.deliveryTime || ""}
                        onChange={(e) =>
                          setDeliveryTimes({
                            ...deliveryTimes,
                            [schedule.id]: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded"
                      />
                      <Button
                        onClick={() => handleUpdateDeliveryTime(schedule.id)}
                        disabled={updateDeliveryTimeMutation.isPending}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold"
                      >
                        更新
                      </Button>
                    </div>
                  </div>

                  {schedule.order?.notes && (
                    <div className="pt-4 border-t border-gray-800">
                      <p className="text-gray-400 text-sm">備註</p>
                      <p className="text-gray-100">{schedule.order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-100 mb-2">當日排程</h1>
          <p className="text-gray-400 text-sm md:text-base">TODAY'S SCHEDULE</p>
        </div>

        {renderScheduleGroup("到府收件", pickupSchedules)}
        {renderScheduleGroup("到府送回", deliverySchedules)}
        {renderScheduleGroup("自行送件", selfSchedules)}
      </div>
    </div>
  );
}
