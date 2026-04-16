import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronRight, Clock, MapPin, Phone, Package } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type AdminTab = "schedule" | "customers" | "orders" | "manual";

const deliveryTypeLabels: Record<string, string> = {
  pickup: "到府取件",
  delivery: "到府送回",
  self: "自行送件",
};

const paymentStatusLabels: Record<string, string> = {
  paid: "已付款",
  unpaid: "未付款",
};

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTab>("schedule");
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);

  // Redirect non-admin users
  if (!authLoading && user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  // Fetch data
  const { data: todaySchedules = [] } = trpc.schedule.getTodaySchedulesWithDetails.useQuery();
  const { data: allCustomers = [] } = trpc.admin.getAllCustomers.useQuery();
  const { data: ordersWithCustomers = [] } = trpc.admin.getOrdersWithCustomers.useQuery();

  // Update delivery time mutation
  const updateDeliveryTime = trpc.schedule.updateDeliveryTime.useMutation({
    onSuccess: () => {
      toast.success("送貨時間已更新");
    },
    onError: () => {
      toast.error("更新失敗");
    },
  });

  // Mark completed mutation
  const markCompleted = trpc.schedule.markCompleted.useMutation({
    onSuccess: () => {
      toast.success("已標記為完成");
    },
    onError: () => {
      toast.error("標記失敗");
    },
  });

  // Categorize schedules
  const categorizedSchedules = useMemo(() => {
    const pickup = todaySchedules.filter((s) => s.order?.deliveryType === "pickup");
    const delivery = todaySchedules.filter((s) => s.order?.deliveryType === "delivery");
    const self = todaySchedules.filter((s) => s.order?.deliveryType === "self");

    return {
      pickup: pickup.sort((a, b) => (a.deliveryTime || "").localeCompare(b.deliveryTime || "")),
      delivery: delivery.sort((a, b) => (a.deliveryTime || "").localeCompare(b.deliveryTime || "")),
      self: self.sort((a, b) => (a.deliveryTime || "").localeCompare(b.deliveryTime || "")),
    };
  }, [todaySchedules]);

  // Get customer orders
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return ordersWithCustomers.filter((o) => o.customerId === selectedCustomer);
  }, [selectedCustomer, ordersWithCustomers]);

  const renderScheduleCard = (schedule: any) => (
    <Card key={schedule.id} className="border-l-4 border-l-gray-600 bg-gray-900 hover:bg-gray-800 transition">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Customer Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-white">{schedule.customer?.fullName || "未知客戶"}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <MapPin className="w-4 h-4" />
                {schedule.customer?.address || "無地址"}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4" />
                {schedule.customer?.phone || "無電話"}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-800 p-2 rounded">
              <span className="text-gray-400">袋數</span>
              <p className="font-bold text-white flex items-center gap-1">
                <Package className="w-4 h-4" />
                {schedule.order?.bagCount}
              </p>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <span className="text-gray-400">付費方式</span>
              <p className="font-bold text-white">
                <Badge variant={schedule.order?.paymentStatus === "paid" ? "default" : "secondary"}>
                  {paymentStatusLabels[schedule.order?.paymentStatus] || schedule.order?.paymentStatus}
                </Badge>
              </p>
            </div>
          </div>

          {/* Delivery Time Input */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <Input
              type="time"
              defaultValue={schedule.deliveryTime || ""}
              className="flex-1 bg-gray-800 border-gray-700"
              onChange={(e) => {
                const newTime = e.target.value;
                if (newTime) {
                  updateDeliveryTime.mutate({
                    scheduleId: schedule.id,
                    deliveryTime: newTime,
                  });
                }
              }}
            />
          </div>

          {/* Notes */}
          {schedule.order?.notes && (
            <div className="text-sm bg-gray-800 p-2 rounded text-gray-300">
              <span className="text-gray-400">備註：</span> {schedule.order.notes}
            </div>
          )}

          {/* Completion Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <span className="text-sm text-gray-400">已完成</span>
            <Switch
              checked={schedule.isCompleted}
              onCheckedChange={(checked) => {
                if (checked) {
                  markCompleted.mutate({ scheduleId: schedule.id });
                }
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-black text-white">ADMIN</h2>
          <p className="text-xs text-gray-400 mt-1">MANAGEMENT PANEL</p>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`w-full text-left px-4 py-3 rounded transition flex items-center justify-between ${
              activeTab === "schedule" ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            <span>當日排程</span>
            {activeTab === "schedule" && <ChevronRight className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`w-full text-left px-4 py-3 rounded transition flex items-center justify-between ${
              activeTab === "customers" ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            <span>會員資料</span>
            {activeTab === "customers" && <ChevronRight className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full text-left px-4 py-3 rounded transition flex items-center justify-between ${
              activeTab === "orders" ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            <span>訂單統計</span>
            {activeTab === "orders" && <ChevronRight className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`w-full text-left px-4 py-3 rounded transition flex items-center justify-between ${
              activeTab === "manual" ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            <span>手動新增</span>
            {activeTab === "manual" && <ChevronRight className="w-4 h-4" />}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "schedule" && (
          <div className="p-8">
            <h1 className="text-5xl font-black text-white mb-2">當日排程</h1>
            <p className="text-gray-400 mb-8">TODAY'S SCHEDULE</p>

            <div className="space-y-8">
              {/* Pickup Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">到府取件</h2>
                <div className="grid gap-4">
                  {categorizedSchedules.pickup.length > 0 ? (
                    categorizedSchedules.pickup.map(renderScheduleCard)
                  ) : (
                    <p className="text-gray-500">暫無取件行程</p>
                  )}
                </div>
              </div>

              {/* Delivery Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">到府送回</h2>
                <div className="grid gap-4">
                  {categorizedSchedules.delivery.length > 0 ? (
                    categorizedSchedules.delivery.map(renderScheduleCard)
                  ) : (
                    <p className="text-gray-500">暫無送回行程</p>
                  )}
                </div>
              </div>

              {/* Self Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">自行送件</h2>
                <div className="grid gap-4">
                  {categorizedSchedules.self.length > 0 ? (
                    categorizedSchedules.self.map(renderScheduleCard)
                  ) : (
                    <p className="text-gray-500">暫無自行送件</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="p-8">
            <h1 className="text-5xl font-black text-white mb-2">會員資料</h1>
            <p className="text-gray-400 mb-8">CUSTOMER MANAGEMENT</p>

            <div className="grid grid-cols-3 gap-6">
              {/* Customer List */}
              <div className="col-span-1">
                <Card className="bg-gray-900 border-gray-800 h-fit">
                  <CardHeader>
                    <CardTitle className="text-white">會員列表</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {allCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer.id)}
                        className={`w-full text-left p-3 rounded transition ${
                          selectedCustomer === customer.id
                            ? "bg-gray-700 text-white"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        <div className="font-bold">{customer.fullName}</div>
                        <div className="text-xs text-gray-400">{customer.phone}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Customer Details */}
              <div className="col-span-2">
                {selectedCustomer ? (
                  <div className="space-y-6">
                    {allCustomers
                      .filter((c) => c.id === selectedCustomer)
                      .map((customer) => (
                        <Card key={customer.id} className="bg-gray-900 border-gray-800">
                          <CardHeader>
                            <CardTitle className="text-white">{customer.fullName}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <span className="text-gray-400">電話</span>
                              <p className="text-white font-bold">{customer.phone}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">地址</span>
                              <p className="text-white font-bold">{customer.address || "未填寫"}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                    {/* Customer Orders */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-white">訂購紀錄</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {customerOrders.length > 0 ? (
                          customerOrders.map((order) => (
                            <div key={order.id} className="bg-gray-800 p-3 rounded">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-sm text-gray-400">
                                    {new Date(order.createdAt).toLocaleDateString("zh-TW")}
                                  </div>
                                  <div className="text-white font-bold mt-1">袋數: {order.bagCount}</div>
                                </div>
                                <Badge variant="outline">{deliveryTypeLabels[order.deliveryType]}</Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">暫無訂購紀錄</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <p>選擇會員以查看詳情</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="p-8">
            <h1 className="text-5xl font-black text-white mb-2">訂單統計</h1>
            <p className="text-gray-400 mb-8">ORDER STATISTICS</p>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-gray-800 p-6 rounded">
                    <p className="text-gray-400 text-sm">總訂單數</p>
                    <p className="text-4xl font-black text-white mt-2">{ordersWithCustomers.length}</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded">
                    <p className="text-gray-400 text-sm">總袋數</p>
                    <p className="text-4xl font-black text-white mt-2">
                      {ordersWithCustomers.reduce((sum, o) => sum + o.bagCount, 0)}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded">
                    <p className="text-gray-400 text-sm">已付款</p>
                    <p className="text-4xl font-black text-white mt-2">
                      {ordersWithCustomers.filter((o) => o.paymentStatus === "paid").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "manual" && (
          <div className="p-8">
            <h1 className="text-5xl font-black text-white mb-2">手動新增訂單</h1>
            <p className="text-gray-400 mb-8">MANUAL ORDER ENTRY</p>

            <Card className="bg-gray-900 border-gray-800 max-w-2xl">
              <CardContent className="p-6">
                <p className="text-gray-400">此功能即將推出</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
