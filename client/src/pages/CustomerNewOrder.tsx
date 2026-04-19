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
          <h1 className="text-5xl font-bold text-gray-900 mb-2">新增訂單</h1>
          <p className="text-gray-600 text-lg">填入訂單資訊並送出</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 區塊一：會員資料 */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">區塊一：會員資料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 自動填入勾選框 */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="useUserInfo"
                  checked={useUserInfo}
                  onChange={(e) => setUseUserInfo(e.target.checked)}
                  className="w-5 h-5 cursor-pointer text-blue-600 rounded"
                />
                <label htmlFor="useUserInfo" className="text-sm font-medium text-gray-700 cursor-pointer">
                  同會員註冊資料
                </label>
              </div>

              {/* 姓名 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  姓名 <span className="text-red-500">*</span>
                </label>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  電話 <span className="text-red-500">*</span>
                </label>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  地址 <span className="text-red-500">*</span>
                </label>
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
              <CardTitle className="text-2xl text-gray-900">區塊二：訂單資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 袋數 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  袋數 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={bagCount}
                  onChange={(e) => setBagCount(e.target.value)}
                  placeholder="請輸入袋數"
                  className="border-gray-300"
                />
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  備註
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="請輸入備註（選填）"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* 支付方式：按鈕組 */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">支付方式</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3">
                {[
                  { value: "cash", label: "現金" },
                  { value: "line_pay", label: "LINE Pay" },
                  { value: "apple_pay", label: "Apple Pay" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPaymentMethod(option.value as any)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 font-semibold transition ${
                      paymentMethod === option.value
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 提交按鈕 */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-3 text-base font-semibold"
            >
              {createOrderMutation.isPending ? "送出中..." : "送出訂單"}
            </Button>
            <Button
              type="button"
              onClick={() => setLocation("/customer/home")}
              className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 py-3 text-base font-semibold"
            >
              取消
            </Button>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}
