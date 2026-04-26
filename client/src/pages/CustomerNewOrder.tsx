import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CustomerNewOrder() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // 一：會員資料狀態
  const [useUserInfo, setUseUserInfo] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // 二：訂單資訊狀態
  const [bagCount, setBagCount] = useState("");
  const [notes, setNotes] = useState("");

  // 新增：衣物放置地點
  const [itemLocation, setItemLocation] = useState<"lobby" | "door" | "other" | "">("");

  // 新增：訂單相片
  const [orderPhotos, setOrderPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 查詢最新的 customer profile
  const { data: customerProfile } = trpc.customer.getProfile.useQuery();

  // 創建訂單 mutation
  const createOrderMutation = trpc.order.create.useMutation({
    onSuccess: () => {
      // 重定向到歷史訂單頁面
      setLocation("/customer/history");
    },
    onError: (error) => {
      alert(`建立訂單失敗: ${error.message}`);
    },
  });

  // 當勾選自動填入時，從最新的 customer profile 填充
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

  // 拍照功能
  const handleTakePhoto = () => {
    fileInputRef.current?.click();
  };

  // 處理照片上傳
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      
      // 上傳照片到 S3
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      const photoUrl = data.url;
      
      // 添加照片到列表
      setOrderPhotos(prev => [...prev, photoUrl]);
    } catch (error) {
      alert("照片上傳失敗，請重試");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 刪除照片
  const handleDeletePhoto = (index: number) => {
    setOrderPhotos(prev => prev.filter((_, i) => i !== index));
  };

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

    // 驗證衣物放置地點
    if (!itemLocation) {
      alert("請選擇衣物放置地點");
      return;
    }

    // 預設送件方式為「到府收送」
    const deliveryType = "pickup";

    // 預設支付方式為現金
    const paymentMethod = "cash";

    await createOrderMutation.mutateAsync({
      deliveryType: deliveryType as "pickup" | "delivery" | "self",
      bagCount: parseInt(bagCount),
      paymentMethod: paymentMethod,
      notes: notes || undefined,
      itemLocation: itemLocation as "lobby" | "door" | "other",
      orderPhotos: orderPhotos.length > 0 ? orderPhotos : undefined,
    });
  };

  return (
    <CustomerLayout>
      <div className="space-y-8 max-w-3xl">
        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新增訂單</h1>
          <p className="text-gray-600 text-lg">填入訂單資訊並送出</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 一、會員資料 */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">一、會員資料</CardTitle>
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

          {/* 二、訂單資訊 */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">二、訂單資訊</CardTitle>
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

              {/* 衣物放置地點 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  衣物放置地點 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col md:flex-row gap-3">
                  {[
                    { value: "lobby", label: "大樓大廳" },
                    { value: "door", label: "住家門口" },
                    { value: "other", label: "其他" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setItemLocation(option.value as any)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 font-semibold transition ${
                        itemLocation === option.value
                          ? "bg-blue-600 text-white border-blue-600 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
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

          {/* 新增相片 */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">放置地點照片（協助確認實際位置）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                onClick={handleTakePhoto}
                disabled={isUploadingPhoto}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold"
              >
                {isUploadingPhoto ? "上傳中..." : "拍照上傳"}
              </Button>

              {/* 照片列表 */}
              {orderPhotos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {orderPhotos.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={photo}
                        alt={`照片 ${idx + 1}`}
                        className="w-full h-24 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80"
                        onClick={() => {
                          setSelectedPhotoUrl(photo);
                          setShowPhotoModal(true);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

        {/* 隱藏的文件輸入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        {/* 照片放大預覽 */}
        <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
          <DialogContent className="bg-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>照片預覽</DialogTitle>
            </DialogHeader>
            {selectedPhotoUrl && (
              <img
                src={selectedPhotoUrl}
                alt="預覽"
                className="w-full h-auto rounded"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CustomerLayout>
  );
}
