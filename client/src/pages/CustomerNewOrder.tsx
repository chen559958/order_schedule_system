import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function CustomerNewOrder() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // 區塊一：會員資料狀態
  const [useUserInfo, setUseUserInfo] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // 區塊二：訂單資訊狀態
  const [bagCount, setBagCount] = useState("");
  const [notes, setNotes] = useState("");

  // 支付方式狀態（按鈕組）
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "line_pay" | "apple_pay" | "">("");

  // 查詢最新的 customer profile
  const { data: customerProfile } = trpc.customer.getProfile.useQuery();

  // 創建訂單 mutation
  const createOrderMutation = trpc.order.create.useMutation({
    onSuccess: () => {
      // 重定向到首頁
      setLocation("/customer/home");
    },
    onError: (error) => {
      alert(`建立訂單失敗: ${error.message}`);
    },
  });

  // 當勾選自動填入時，從最新的 customer profile 填充
  // 使用 useEffect 監聽 Checkbox 狀態和 customerProfile 變化
  useEffect(() => {
    if (useUserInfo && customerProfile) {
      setCustomerName(customerProfile.fullName || "");
      setCustomerPhone(customerProfile.phone || "");
      setCustomerAddress(customerProfile.address || "");
    } else if (!useUserInfo) {
      // 未勾選時清空
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
    }
  }, [useUserInfo, customerProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證會員資料
    if (!customerName || !customerPhone || !customerAddress) {
      alert("請填入會員資料");
      return;
    }

    // 驗證訂單資訊
    if (!bagCount) {
      alert("請填入袋數");
      return;
    }

    // 驗證支付方式
    if (!paymentMethod) {
      alert("請選擇支付方式");
      return;
    }

    // 預設送件方式為「到府收送」
    const deliveryType = "pickup";

    // 將支付方式映射到後端接受的值
    let mappedPaymentMethod: "cash" | "credit_card" | "line_pay" | "points" = "cash";
    if (paymentMethod === "line_pay") {
      mappedPaymentMethod = "line_pay";
    } else if (paymentMethod === "apple_pay") {
      // Apple Pay 暫時映射到 credit_card
      mappedPaymentMethod = "credit_card";
    }

    await createOrderMutation.mutateAsync({
      deliveryType: deliveryType as "pickup" | "delivery" | "self",
      bagCount: parseInt(bagCount),
      paymentMethod: mappedPaymentMethod,
      notes: notes || undefined,
    });
  };

  return (
    <CustomerLayout>
      <div className="space-y-8 max-w-3xl">
        {/* 頁面標題 */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">新增訂單</h1>
          <p className="text-gray-600">填寫訂單資訊並提交</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 區塊一：會員資料 */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">會員資料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Checkbox：同會員註冊資料 */}
              <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="useUserInfo"
                  checked={useUserInfo}
                  onChange={(e) => setUseUserInfo(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="useUserInfo" className="text-sm font-medium text-gray-700 cursor-pointer">
                  同會員註冊資料
                </label>
              </div>

              {/* 姓名 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">姓名</label>
                <Input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="請輸入姓名"
                  className="border-gray-300"
                />
              </div>

              {/* 電話 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">電話</label>
                <Input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="請輸入電話"
                  className="border-gray-300"
                />
              </div>

              {/* 地址 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">地址</label>
                <Input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="請輸入地址"
                  className="border-gray-300"
                />
              </div>
            </CardContent>
          </Card>

          {/* 區塊二：訂單資訊 */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">訂單資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 袋數 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">袋數</label>
                <Input
                  type="number"
                  value={bagCount}
                  onChange={(e) => setBagCount(e.target.value)}
                  placeholder="請輸入袋數"
                  min="1"
                  className="border-gray-300"
                />
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">備註</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="請輸入備註（選填）"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* 支付方式 - 按鈕組 */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">支付方式</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    paymentMethod === "cash"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  現金
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("line_pay")}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    paymentMethod === "line_pay"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  LINE Pay
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("apple_pay")}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    paymentMethod === "apple_pay"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Apple Pay
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 提交按鈕 */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
            >
              {createOrderMutation.isPending ? "提交中..." : "提交訂單"}
            </Button>
            <Button
              type="button"
              onClick={() => setLocation("/customer/home")}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg"
            >
              取消
            </Button>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}
