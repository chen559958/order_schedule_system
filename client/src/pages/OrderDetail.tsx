
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
import { useAuth } from "@/_core/hooks/useAuth";

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
  const [photoItemId, setPhotoItemId] = useState<number | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [itemPhotos, setItemPhotos] = useState<{ [key: number]: any[] }>({});
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
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
    { orderId: queriedOrder?.id || 0 },
    { enabled: !!queriedOrder?.id }
  );

  // 獲取多張照片
  const getPhotosQuery = (itemId: number) => {
    return trpc.orderItem.getPhotos.useQuery(
      { itemId },
      { enabled: !!itemId }
    );
  };

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

  // 添加照片的 mutation
  const addPhotoMutation = trpc.orderItem.addPhoto.useMutation({
    onSuccess: () => {
      // 重新查詢訂單以獲取最新照片
      queryOrder.refetch();
    },
  });

  // 刪除照片的 mutation
  const deletePhotoMutation = trpc.orderItem.deletePhoto.useMutation({
    onSuccess: () => {
      // 重新查詢訂單以獲取最新照片
      queryOrder.refetch();
    },
  });

  // 監聽訂單
  useEffect(() => {
    if (queriedOrder) {
      if (queriedOrder.id) {
        setOrder(queriedOrder);
      }
      setIsLoading(false);
    }
  }, [queriedOrder, orderLoading]);

  // 監聽訂單項目
  useEffect(() => {
    if (orderItems) {
      // 按 itemNumber 排序
      const sortedItems = [...orderItems].sort((a, b) => {
        const aNum = parseInt(a.itemNumber.split('-').pop() || '0');
        const bNum = parseInt(b.itemNumber.split('-').pop() || '0');
        return aNum - bNum;
      });
      setItems(sortedItems);
      
      // 從後端數據中提取照片
      const photosMap: Record<number, any[]> = {};
      sortedItems.forEach(item => {
        photosMap[item.id] = (item as any).photos?.filter((p: any) => p.id !== null) || [];
      });
      setItemPhotos(photosMap);
    }
  }, [orderItems]);

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
      
      // 保存照片到數據庫
      await addPhotoMutation.mutateAsync({
        itemId: photoItemId,
        photoUrl: photoUrl,
      });
      
      // 重新加載該 item 的照片列表
      await loadPhotosForItem(photoItemId);
      
      // 更新衣物的 photoUrl（保存第一張照片）
      const currentPhotos = itemPhotos[photoItemId] || [];
      if (currentPhotos.length === 0) {
        updateItemMutation.mutate({
          itemId: photoItemId,
          photoUrl: photoUrl,
        });
      }
    } catch (error) {
      setErrorMessage("照片上傳失敗，請重試");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 刪除照片
  const handleDeletePhoto = async (itemId: number, photoId: number) => {
    try {
      await deletePhotoMutation.mutateAsync({ photoId });
      // 重新加載該 item 的照片列表
      await loadPhotosForItem(itemId);
    } catch (error) {
      setErrorMessage("刪除照片失敗，請重試");
    }
  };

  // 生成衣物編號
  const generateItemNumbers = () => {
    if (!order || itemCount <= 0) {
      setErrorMessage("請先選擇訂單並輸入件數");
      return;
    }

    if (!order.orderNumber) {
      setErrorMessage("訂單編號不存在，請重新加載頁面");
      return;
    }

    if (!order.id) {
      setErrorMessage("訂單 ID 不存在，請重新加載頁面");
      return;
    }

    // 生成多個衣物編號
    for (let i = 1; i <= itemCount; i++) {
      const itemNumber = `${order.orderNumber}-${String(i).padStart(2, "0")}`;
      createItemMutation.mutate({ orderId: order.id, itemNumber, notes: "" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="text-gray-600">載入中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="text-gray-600">找不到訂單</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 訂單資訊 */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl text-gray-900">訂單詳情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">訂單編號</p>
                <p className="text-xl font-semibold text-gray-900">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">袋數</p>
                <p className="text-xl font-semibold text-gray-900">{order.bagCount} 袋</p>
              </div>
            </div>
            {order.notes && (
              <div>
                <p className="text-sm text-gray-600">備註</p>
                <p className="text-gray-900">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 錯誤消息 */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {errorMessage}
          </div>
        )}

        {/* 衣物編號列表 */}
        {items.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-sm mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">衣物清單</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    {/* 衣物編號 */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-lg text-gray-900">{item.itemNumber}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTakePhoto(item.id)}
                          disabled={isUploadingPhoto && photoItemId === item.id}
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

                    {/* 備註 */}
                    {item.notes && (
                      <div className="mb-3 p-2 bg-white rounded border border-gray-300">
                        <p className="text-sm text-gray-600">備註：{item.notes}</p>
                      </div>
                    )}

                    {/* 照片列表 */}
                    {itemPhotos[item.id] && itemPhotos[item.id].length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {itemPhotos[item.id].map((photo: any, idx: number) => (
                          <div key={photo.id || idx} className="relative group">
                            <img
                              src={photo.photoUrl}
                              alt={`照片 ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80"
                              onClick={() => {
                                setSelectedPhotoUrl(photo.photoUrl);
                                setShowPhotoModal(true);
                              }}
                            />
                            <button
                              onClick={() => handleDeletePhoto(item.id, photo.id)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 新增衣物編號 */}
        {items.length === 0 && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">新增衣物編號</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  衣物件數
                </label>
                <Input
                  type="number"
                  min="1"
                  value={itemCount}
                  onChange={(e) => setItemCount(parseInt(e.target.value) || 0)}
                  placeholder="輸入件數"
                  className="border-gray-300"
                />
              </div>
              <Button
                onClick={generateItemNumbers}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={createItemMutation.isPending}
              >
                {createItemMutation.isPending ? "生成中..." : "生成衣物編號"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 隱藏的文件輸入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        {/* 編輯備註對話框 */}
        <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>編輯備註</DialogTitle>
            </DialogHeader>
            <Textarea
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              placeholder="輸入備註"
              className="border-gray-300"
            />
            <DialogFooter>
              <Button
                onClick={() => setShowItemDialog(false)}
                variant="outline"
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
                  setShowItemDialog(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
    </div>
  );
}
