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

  // 1. 先查詢訂單
  const { data: queriedOrder, isLoading: orderLoading, error: orderError } = trpc.order.getByOrderNumber.useQuery(
    { orderNumber: orderNumber || "" },
    { enabled: !!orderNumber && !userLoading }
  );

  // 2. 根據訂單 ID 查詢訂單項目
  useEffect(() => {
    console.log('[DEBUG] queriedOrder changed:', queriedOrder);
  }, [queriedOrder]);

  const { data: orderItems, refetch: refetchOrderItems, error: itemsError } = trpc.orderItem.getByOrderId.useQuery(
    { orderId: queriedOrder?.id || 0 },
    { enabled: !!queriedOrder?.id }
  );

  useEffect(() => {
    if (itemsError) {
      console.error('[ERROR] orderItems query error:', itemsError);
    }
  }, [itemsError]);

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
      refetchOrderItems();
    },
  });

  // 刪除照片的 mutation
  const deletePhotoMutation = trpc.orderItem.deletePhoto.useMutation({
    onSuccess: () => {
      refetchOrderItems();
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
    console.log('[DEBUG] orderItems changed:', orderItems);
    if (orderItems) {
      // 按 itemNumber 排序
      const sortedItems = [...orderItems].sort((a, b) => {
        const aNum = parseInt(a.itemNumber.split('-').pop() || '0');
        const bNum = parseInt(b.itemNumber.split('-').pop() || '0');
        return aNum - bNum;
      });
      setItems(sortedItems);
    }
  }, [orderItems]);

  // 拍照功能
  const handleTakePhoto = async (itemId: number) => {
    setPhotoItemId(itemId);
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !photoItemId) return;

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('上傳失敗');

      const { url } = await response.json();
      await addPhotoMutation.mutateAsync({
        itemId: photoItemId,
        photoUrl: url,
      });

      setPhotoItemId(null);
    } catch (error) {
      console.error('上傳照片失敗:', error);
      setErrorMessage('上傳照片失敗');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleGenerateItems = async () => {
    if (!order || itemCount <= 0) {
      setErrorMessage("請輸入有效的衣物數量");
      return;
    }

    try {
      for (let i = 1; i <= itemCount; i++) {
        const itemNumber = `${order.orderNumber}-${String(i).padStart(2, '0')}`;
        await createItemMutation.mutateAsync({
          orderId: order.id,
          itemNumber,
        });
      }
      setShowItemDialog(false);
    } catch (error) {
      console.error('生成衣物編號失敗:', error);
    }
  };

  if (isLoading) {
    return <div className="p-4">載入中...</div>;
  }

  if (!order) {
    return <div className="p-4">訂單未找到</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{order.orderNumber}</h1>
        <p className="text-gray-600">訂單詳情</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>訂單信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">訂單編號</p>
              <p className="font-semibold">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">袋數</p>
              <p className="font-semibold">{order.bagCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>衣物項目</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">還沒有衣物項目</p>
              <Button onClick={() => setShowItemDialog(true)}>
                生成衣物編號
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{item.itemNumber}</p>
                      <p className="text-sm text-gray-600">{item.notes || '無備註'}</p>
                    </div>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTakePhoto(item.id)}
                        disabled={isUploadingPhoto}
                      >
                        拍照
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingItemId(item.id);
                          setEditingNotes(item.notes || '');
                        }}
                      >
                        編輯
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteItemMutation.mutate({ itemId: item.id })}
                      >
                        刪除
                      </Button>
                    </div>
                  </div>

                  {/* 照片列表 */}
                  {itemPhotos[item.id] && itemPhotos[item.id].length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {itemPhotos[item.id].map((photo) => (
                        <div key={photo.id} className="relative">
                          <img
                            src={photo.photoUrl}
                            alt={`照片 ${photo.id}`}
                            className="w-full h-24 object-cover rounded cursor-pointer"
                            onClick={() => {
                              setSelectedPhotoUrl(photo.photoUrl);
                              setShowPhotoModal(true);
                            }}
                          />
                          <button
                            onClick={() => deletePhotoMutation.mutate({ photoId: photo.id })}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 生成衣物編號對話框 */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>生成衣物編號</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-100 text-red-800 rounded">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="text-sm font-medium">衣物數量</label>
              <Input
                type="number"
                min="1"
                value={itemCount}
                onChange={(e) => setItemCount(parseInt(e.target.value) || 0)}
                placeholder="輸入衣物數量"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>
              取消
            </Button>
            <Button onClick={handleGenerateItems} disabled={createItemMutation.isPending}>
              {createItemMutation.isPending ? '生成中...' : '生成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編輯備註對話框 */}
      <Dialog open={editingItemId !== null} onOpenChange={() => setEditingItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯備註</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              placeholder="輸入備註"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItemId(null)}>
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
              disabled={updateItemMutation.isPending}
            >
              {updateItemMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 照片預覽 Modal */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>照片預覽</DialogTitle>
          </DialogHeader>
          {selectedPhotoUrl && (
            <img src={selectedPhotoUrl} alt="預覽" className="w-full" />
          )}
        </DialogContent>
      </Dialog>

      {/* 隱藏的文件輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelected}
        className="hidden"
      />
    </div>
  );
}
