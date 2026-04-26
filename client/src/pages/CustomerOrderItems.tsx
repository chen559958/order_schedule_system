import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ChevronLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CustomerOrderItems() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/customer/order/:orderId/items");
  const orderId = params?.orderId ? parseInt(params.orderId) : null;

  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // 獲取訂單信息
  const { data: order, isLoading: orderLoading } = trpc.order.getById.useQuery(
    { orderId: orderId || 0 },
    { enabled: !!orderId }
  );

  // 獲取訂單項目
  const { data: items = [], isLoading: itemsLoading } = trpc.order.getOrderItems.useQuery(
    { orderId: orderId || 0 },
    { enabled: !!orderId }
  );

  if (!match || !orderId) {
    return (
      <CustomerLayout>
        <div className="text-center py-12 text-gray-500">
          <p>找不到訂單</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* 返回按鈕 */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setLocation("/customer/home")}
            variant="ghost"
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5" />
            返回首頁
          </Button>
        </div>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">衣物詳情</h1>
          {order && (
            <p className="text-gray-600">訂單編號：{order.orderNumber}</p>
          )}
        </div>

        {/* 訂單信息卡片 */}
        {order && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">訂單信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">訂單編號</p>
                  <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">下單日期</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString("zh-TW")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 衣物列表 */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">衣物列表</CardTitle>
          </CardHeader>
          <CardContent>
            {itemsLoading ? (
              <div className="text-center py-8 text-gray-500">
                <p>載入中...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>目前沒有衣物項目</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item: any, index: number) => (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm text-gray-600">衣物編號</p>
                        <p className="text-lg font-bold text-gray-900">{item.itemNumber}</p>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">備註：</span>
                          {item.notes}
                        </p>
                      </div>
                    )}

                    {/* 照片顯示 */}
                    {item.photoUrl && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">照片：</p>
                        <div className="flex gap-2">
                          <img
                            src={item.photoUrl}
                            alt={`衣物 ${item.itemNumber} 照片`}
                            className="w-24 h-24 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80"
                            onClick={() => {
                              setSelectedPhotoUrl(item.photoUrl);
                              setShowPhotoModal(true);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
    </CustomerLayout>
  );
}
