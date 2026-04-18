import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function PlaceOrder() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [useAutoInfo, setUseAutoInfo] = useState(true);
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery" | "self">("pickup");
  const [bagCount, setBagCount] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit_card" | "line_pay" | "points">("cash");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: profile } = trpc.customer.getProfile.useQuery();
  const createOrderMutation = trpc.order.create.useMutation();

  useEffect(() => {
    if (profile && useAutoInfo) {
      setFullName(profile.fullName);
      setAddress(profile.address);
      setPhone(profile.phone);
    }
  }, [profile, useAutoInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !address.trim() || !phone.trim() || !bagCount) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    setIsLoading(true);
    try {
      await createOrderMutation.mutateAsync({
        deliveryType,
        bagCount: parseInt(bagCount),
        paymentMethod,
        notes: notes || undefined,
      });
      toast.success("訂單已送出！");
      setLocation("/orders");
    } catch (error) {
      toast.error("訂單送出失敗，請稍後重試");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-100 mb-2">下單</h1>
          <p className="text-gray-400 text-sm md:text-base">PLACE YOUR ORDER</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 收件人資訊 */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-100">收件人資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="autoInfo"
                  checked={useAutoInfo}
                  onCheckedChange={(checked) => setUseAutoInfo(checked as boolean)}
                  className="border-gray-600"
                />
                <Label htmlFor="autoInfo" className="text-gray-300 cursor-pointer">
                  自動帶入會員資訊
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300">
                  姓名
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="請輸入姓名"
                  className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-300">
                  地址
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="請輸入地址"
                  className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">
                  電話
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="請輸入電話"
                  className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* 訂單內容 */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-100">訂單內容</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryType" className="text-gray-300">
                  送件方式
                </Label>
                <Select value={deliveryType} onValueChange={(value: any) => setDeliveryType(value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="pickup">到府收件</SelectItem>
                    <SelectItem value="delivery">到府送回</SelectItem>
                    <SelectItem value="self">自行送件</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bagCount" className="text-gray-300">
                  袋數
                </Label>
                <Input
                  id="bagCount"
                  type="number"
                  min="1"
                  value={bagCount}
                  onChange={(e) => setBagCount(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="text-gray-300">
                  付費方式
                </Label>
                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="cash">現金</SelectItem>
                    <SelectItem value="credit_card">信用卡</SelectItem>
                    <SelectItem value="line_pay">LINE Pay</SelectItem>
                    <SelectItem value="points">點數扣款</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-300">
                  備註
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="請輸入任何特殊要求或備註"
                  className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 min-h-24"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={isLoading || createOrderMutation.isPending}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold py-6 text-lg"
          >
            {isLoading || createOrderMutation.isPending ? "送出中..." : "送出訂單"}
          </Button>
        </form>
      </div>
    </div>
  );
}
