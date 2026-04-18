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

  // 會員資料狀態
  const [useUserInfo, setUseUserInfo] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // 訂單資訊狀態
  const [bagCount, setBagCount] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile">("");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery" | "self">("");

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

  // 當勾選自動填入時，從用戶信息填充
  useEffect(() => {
    if (useUserInfo && user) {
      setCustomerName(user.name || "");
      setCustomerPhone(user.phone || "");
      setCustomerAddress(user.address || "");
    } else {
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
    }
  }, [useUserInfo, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerPhone || !customerAddress) {
      alert("請填入會員資料");
      return;
    }

    if (!bagCount || !paymentMethod || !deliveryType) {
      alert("請填入訂單資訊");
      return;
    }

    await createOrderMutation.mutateAsync({
      customerName,
      customerPhone,
      customerAddress,
      bagCount: parseInt(bagCount),
      notes,
      paymentMethod,
      deliveryType,
    });
  };

  return (
    <CustomerLayout>
      <div className="space-y-8 max-w-2xl">
        {/* 頁面標題 */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">新增訂單</h1>
          <p className="text-gray-600">填入訂單資訊並送出</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 會員資料區塊 */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">會員資料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 自動填入勾選框 */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="useUserInfo"
                  checked={useUserInfo}
                  onChange={(e) => setUseUserInfo(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="useUserInfo" className="text-sm font-medium text-gray-700 cursor-pointer">
                  使用我的個人資料自動填入
                </label>
              </div>

              {/* 姓名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

          {/* 訂單資訊區塊 */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">訂單資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 送件方式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  送件方式 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  {[
                    { value: "pickup", label: "到府收送 - 收件" },
                    { value: "delivery", label: "到府收送 - 送回" },
                    { value: "self", label: "自行送件" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDeliveryType(option.value as any)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition ${
                        deliveryType === option.value
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 袋數 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

              {/* 支付方式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  支付方式 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  {[
                    { value: "cash", label: "現金" },
                    { value: "mobile", label: "行動支付 (LinePay/ApplePay)" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPaymentMethod(option.value as any)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition ${
                        paymentMethod === option.value
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

          {/* 提交按鈕 */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              {createOrderMutation.isPending ? "送出中..." : "送出訂單"}
            </Button>
            <Button
              type="button"
              onClick={() => setLocation("/customer/home")}
              className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              取消
            </Button>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}
