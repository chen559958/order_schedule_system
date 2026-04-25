import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface OrderItem {
  id: number;
  orderId: number;
  itemNumber: string;
  notes: string | null;
  photoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  bagCount: number;
  notes?: string;
}

export default function OrderDetail() {
  const [location] = useLocation();
  // 從 URL 中手動提取 orderNumber（格式：/order/260422-01）
  const orderNumber = location.startsWith('/order/') ? location.substring(7) : '';
  const [, setLocation] = useLocation();
  const { user, isLoading: userLoading } = useAuth();

  // 狀態管理
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [itemCount, setItemCount] = useState<number>(0);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [photoItemId, setPhotoItemId] = useState<number | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 監聽用戶變化，同步數據
  const { data: queriedOrder, isLoading: orderLoading, error: orderError } = trpc.order.getByOrderNumber.useQuery(
    { orderNumber: orderNumber || "" },
    { enabled: !!orderNumber && !userLoading }
  );

  // 調試：打印錯誤信息
  useEffect(() => {
    if (orderError) {
      console.error('Order query error:', orderError);
    }
  }, [orderError]);

  // 獲取訂單項目
  const { data: orderItems, refetch: refetchOrderItems } = trpc.orderItem.getByOrderId.useQuery(
    { orderId: order?.id || 0 },
    { enabled: !!order?.id }
  );

  // 創建衣物編號的 mutation
  const createItemMutation = trpc.orderItem.create.useMutation({
    onSuccess: () => {
      refetchOrderItems();
      setItemCount(0);
      setErrorMessage("");
    },
    onError: (error) => {
      setErrorMessage(`新增衣物失敗: ${error.message}`);
    },
  });

  // 更新衣物備註的 mutation
  const updateItemMutation = trpc.orderItem.update.useMutation({
    onSuccess: () => {
      refetchOrderItems();
      setEditingItemId(null);
      setEditingNotes("");
    },
  });

  // 刪除衣物的 mutation
  const deleteItemMutation = trpc.orderItem.delete.useMutation({
    onSuccess: () => {
      refetchOrderItems();
    },
  });

  // 監聽訂單查詢結果
  useEffect(() => {
    if (!orderLoading) {
      if (queriedOrder) {
        setOrder(queriedOrder);
      }
      setIsLoading(false);
    }
  }, [queriedOrder, orderLoading]);

  // 監聽訂單項目
  useEffect(() => {
    if (orderItems) {
      setItems(orderItems);
    }
  }, [orderItems]);

  // 生成衣物編號
  const generateItemNumbers = () => {
    if (!order || itemCount <= 0) return;

    // 生成多個衣物編號
    for (let i = 1; i <= itemCount; i++) {
      const itemNumber = `${order.orderNumber}-${String(i).padStart(2, "0")}`;
      createItemMutation.mutate({ orderId: order.id, itemNumber, notes: "" });
    }
  };

  // 完成訂單
  const handleCompleteOrder = () => {
    if (!order) return;
    
    // 顯示確認彈出視窗
    const confirmed = window.confirm(`確認該訂單（${order.orderNumber}）已完成？`);
    if (confirmed) {
      // TODO: 調用後端 API 完成訂單
      console.log('Order completed:', order.orderNumber);
      // 完成後導向首頁
      setLocation("/");
    }
  };

  // 拍照功能
  const handleTakePhoto = (itemId: number) => {
    setPhotoItemId(itemId);
    fileInputRef.current?.click();
  };

  // 處理照片上傳
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoItemId) return;

    try {
      setIsUploadingPhoto(true);
      
      // 上傳照片到 S3（需要後端實現 /api/upload-photo）
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      const photoUrl = data.url;
      
      // 更新衣物的 photoUrl
      updateItemMutation.mutate({
        itemId: photoItemId,
        photoUrl: photoUrl,
      });
      
      setPhotoItemId(null);
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('照片上傳失敗，請重試');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // 如果還在加載，顯示載入狀態
  if (isLoading || orderLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">載入中...</p>
          <p className="text-sm text-gray-500">請稍候，正在查詢訂單資訊</p>
        </div>
      </div>
    );
  }

  // 如果查不到訂單，顯示錯誤提示
  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg mb-2">找不到訂單</p>
          <p className="text-sm text-gray-500 mb-6">訂單編號：{orderNumber}</p>
          {orderError && (
            <p className="text-sm text-red-500 mb-6">
              錯誤：{(orderError as any)?.message || '查詢失敗，請重新整理'}
            </p>
          )}
          <Button onClick={() => setLocation("/")} variant="outline">
            返回首頁
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="ml-2"
          >
            重新整理
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 返回按鈕 */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          ← 返回
        </Button>

        {/* 訂單標題 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            您的訂單編號為：{order.orderNumber}
          </h1>
          <p className="text-gray-600">管理您的衣物編號和備註</p>
        </div>

        {/* 衣物編號輸入區 */}
        <Card className="bg-white border-gray-200 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">衣物編號(件數)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                type="number"
                min="1"
                value={itemCount}
                onChange={(e) => setItemCount(parseInt(e.target.value) || 0)}
                placeholder="請輸入件數"
                className="flex-1"
              />
              <Button
                onClick={generateItemNumbers}
                disabled={itemCount <= 0 || createItemMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700 px-6"
              >
                {createItemMutation.isPending ? "生成中..." : "輸入"}
              </Button>
            </div>
            {errorMessage && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errorMessage}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 衣物編號列表 */}
        {items.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-sm mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">衣物清單</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.itemNumber}</p>
                      <p className="text-sm text-gray-600">
                        {item.notes || "無備註"}
                      </p>
                      {item.photoUrl && (
                        <img src={item.photoUrl} alt="衣物照片" className="mt-2 h-12 w-12 rounded object-cover" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTakePhoto(item.id)}
                        disabled={isUploadingPhoto}
                      >
                        {isUploadingPhoto && photoItemId === item.id ? "上傳中..." : "拍照"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingItemId(item.id);
                          setEditingNotes(item.notes || "");
                          setShowItemDialog(true);
                        }}
                      >
                        備註
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteItemMutation.mutate({ itemId: item.id })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 完成訂單按鈕 */}
        <div className="flex gap-3 mt-8">
          <Button
            onClick={handleCompleteOrder}
            className="bg-green-600 text-white hover:bg-green-700 px-8"
          >
            完成訂單
          </Button>
        </div>

        {/* 備註編輯對話框 */}
        <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>編輯衣物備註</DialogTitle>
            </DialogHeader>
            <Textarea
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              placeholder="輸入備註..."
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowItemDialog(false)}
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  if (editingItemId) {
                    updateItemMutation.mutate({
                      itemId: editingItemId,
                      notes: editingNotes,
                    });
                  }
                }}
              >
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 隱藏的文件輸入框 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}
