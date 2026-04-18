import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect } from "react";

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

export default function StaffSchedule() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: schedules, isLoading } = trpc.schedule.getTodaySchedules.useQuery();
  const { data: allOrders } = trpc.order.getAll.useQuery();

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  const completeScheduleMutation = trpc.schedule.markCompleted.useMutation({
    onSuccess: () => {
      // 重新獲取排程
    },
  });

  const scheduleData = schedules
    ?.map((schedule) => {
      const order = allOrders?.find((o) => o.id === schedule.orderId);
      return { ...schedule, order };
    })
    .filter((s) => !s.isCompleted)
    .sort((a, b) => {
      if (!a.deliveryTime || !b.deliveryTime) return 0;
      return a.deliveryTime.localeCompare(b.deliveryTime);
    }) || [];

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-100 mb-2">今日行程</h1>
          <p className="text-gray-400 text-sm md:text-base">TODAY'S ITINERARY</p>
        </div>

        {scheduleData.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center text-gray-400">
              今日無行程
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {scheduleData.map((schedule, index) => (
              <Card key={schedule.id} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-100">
                        行程 #{index + 1}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {schedule.deliveryTime || "時間待定"}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="inline-block px-3 py-1 bg-gray-800 rounded text-sm font-bold text-gray-100">
                        {schedule.order?.deliveryType ? deliveryTypeLabels[schedule.order.deliveryType] : "未知"}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">客戶姓名</p>
                      <p className="text-gray-100 font-bold">{schedule.order?.customerName || "未知"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">電話</p>
                      <p className="text-gray-100 font-bold">{schedule.order?.customerPhone || "未知"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">地址</p>
                      <p className="text-gray-100 font-bold">{schedule.order?.customerAddress || "未知"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">袋數</p>
                      <p className="text-gray-100 font-bold">{schedule.order?.bagCount || "0"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">付費方式</p>
                      <p className="text-gray-100 font-bold">
                        {schedule.order?.paymentMethod ? paymentMethodLabels[schedule.order.paymentMethod] : "未知"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">付款狀態</p>
                      <p className="text-gray-100 font-bold">
                        {schedule.order?.paymentStatus ? paymentStatusLabels[schedule.order.paymentStatus] : "未知"}
                      </p>
                    </div>
                  </div>

                  {schedule.order?.notes && (
                    <div className="pt-4 border-t border-gray-800">
                      <p className="text-gray-400 text-sm">備註</p>
                      <p className="text-gray-100">{schedule.order.notes}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-800 flex gap-2">
                    <Button
                      onClick={() => {
                        completeScheduleMutation.mutate({ scheduleId: schedule.id });
                        // 重新獲取排程
                        setTimeout(() => {
                          window.location.reload();
                        }, 500);
                      }}
                      disabled={completeScheduleMutation.isPending}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    >
                      {completeScheduleMutation.isPending ? "標記中..." : "標記完成"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
