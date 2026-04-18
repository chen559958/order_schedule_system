import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

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

const orderStatusLabels: Record<string, string> = {
  pending: "待處理",
  scheduled: "已排程",
  completed: "已完成",
  cancelled: "已取消",
};

export default function MyOrders() {
  const [, setLocation] = useLocation();
  const { data: orders, isLoading } = trpc.order.getMyOrders.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-100 mb-2">我的訂單</h1>
          <p className="text-gray-400 text-sm md:text-base">MY ORDERS</p>
        </div>

        {!orders || orders.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400 mb-4">您還沒有任何訂單</p>
              <Button
                onClick={() => setLocation("/place-order")}
                className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold"
              >
                立即下單
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-100">
                        訂單 #{order.id}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {new Date(order.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="inline-block px-3 py-1 bg-gray-800 rounded text-sm font-bold text-gray-100">
                        {orderStatusLabels[order.orderStatus] || order.orderStatus}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">送件方式</p>
                      <p className="text-gray-100 font-bold">{deliveryTypeLabels[order.deliveryType]}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">袋數</p>
                      <p className="text-gray-100 font-bold">{order.bagCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">付費方式</p>
                      <p className="text-gray-100 font-bold">{paymentMethodLabels[order.paymentMethod]}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">付款狀態</p>
                      <p className="text-gray-100 font-bold">{paymentStatusLabels[order.paymentStatus]}</p>
                    </div>
                  </div>
                  {order.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-gray-400 text-sm">備註</p>
                      <p className="text-gray-100">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Button
            onClick={() => setLocation("/place-order")}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold py-6 text-lg"
          >
            新增訂單
          </Button>
        </div>
      </div>
    </div>
  );
}
