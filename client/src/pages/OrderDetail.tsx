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
  itemLocation?: string | null;
  photoUrl?: string | null;
}

export default function OrderDetail() {
  const [location, setLocation] = useLocation();
  const orderNumber = location.startsWith('/order/') ? location.substring(7) : '';
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
    if (queriedOrder?.id) {
      console.log('[DEBUG] queriedOrder.id is:', queriedOrder.id, 'type:', typeof queriedOrder.id);
    }
  }, [queriedOrder]);

  const orderId = queriedOrder?.id;
  console.log('[DEBUG] orderId for query:', orderId, 'enabled:', !!orderId);

  const { data: orderItems, refetch: refetchOrderItems, error: itemsError, isLoading: itemsLoading } = trpc.orderItem.getByOrderId.useQuery(
    { orderId: orderId || 0 },
    { enabled: !!orderId && orderId > 0 }
  );

  useEffect(() => {
    if (queriedOrder) {
      setOrder(queriedOrder as Order);
      setIsLoading(false);
    }
  }, [queriedOrder]);

  useEffect(() => {
    if (orderItems) {
      console.log('[DEBUG] Order items updated:', orderItems);
      setItems(orderItems as OrderItem[]);
    }
  }, [orderItems]);

  // 創建訂單項目 mutation
  const createItemMutation = trpc.orderItem.create.useMutation({
    onSuccess: () => {
      setShowItemDialog(false);
      setItemCount(0);
      refetchOrderItems();
    },
    onError: (error) => {
      setErrorMessage(`創建項目失敗: ${error.message}`);
    },
  });

  // 編輯訂單項目 mutation
  const editItemMutation = trpc.orderItem.update.useMutation({
    onSuccess: () => {
      setEditingItemId(null);
      setEditingNotes("");
      refetchOrderItems();
    },
    onError: (error) => {
      setErrorMessage(`編輯項目失敗: ${error.message}`);
    },
  });

  // 刪除訂單項目 mutation
  const deleteItemMutation = trpc.orderItem.delete.useMutation({
    onSuccess: () => {
      refetchOrderItems();
    },
    onError: (error) => {
      setErrorMessage(`刪除項目失敗: ${error.message}`);
    },
  });

  // 拍照功能
  const handleTakePhoto = () => {
    setPhotoItemId(null);
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
      
      console.log('[DEBUG] Photo uploaded:', photoUrl);
      
      // 保存照片到衣物
      if (photoItemId) {
        await trpc.orderItem.addPhoto.mutate({
          itemId: photoItemId,
          photoUrl: photoUrl,
        });
        
        console.log('[DEBUG] Photo saved to item');
        refetchOrderItems();
      }
    } catch (error) {
      console.error('[ERROR] Photo upload failed:', error);
      setErrorMessage("照片上傳失敗，請重試");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 生成衣物編號
  const handleGenerateItems = async () => {
    if (!order?.id || itemCount <= 0) {
      alert("請填入正確的衣物數量");
      return;
    }

    try {
      for (let i = 1; i <= itemCount; i++) {
        const itemNumber = `${order.orderNumber}-${String(i).padStart(2, '0')}`;
        await createItemMutation.mutateAsync({
          orderId: order.id,
          itemNumber: itemNumber,
          notes: "",
        });
        
        // 添加延遲確保順序生成
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('[ERROR] Generate items failed:', error);
    }
  };

  // 保存編輯的備註
  const handleSaveNotes = async () => {
    if (editingItemId) {
      await editItemMutation.mutateAsync({
        itemId: editingItemId,
        notes: editingNotes,
      });
    }
  };

  if (isLoading || orderLoading) {
    return <div className="p-4">加載中...</div>;
  }

  if (orderError || itemsError) {
    return <div className="p-4 text-red-600">加載失敗: {orderError?.message || itemsError?.message}</div>;
  }

  if (!order) {
    return <div className="p-4">訂單未找到</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{order.orderNumber}</h1>
          <p className="text-gray-600">訂單詳情</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setLocation('/admin')}
        >
          ← 返回
        </Button>
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
            <div>
              <p className="text-sm text-gray-600">衣物放置地點</p>
              <p className="font-semibold">
                {order.itemLocation === 'lobby' && '樂住市集'}
                {order.itemLocation === 'door' && '家門口'}
                {order.itemLocation === 'other' && '其他'}
                {!order.itemLocation && '未指定'}
              </p>
            </div>
            {order.photoUrl && (
              <div>
                <p className="text-sm text-gray-600">客戶上傳的照片</p>
                <div className="mt-2">
                  <img
                    src={order.photoUrl}
                    alt="Customer photo"
                    className="w-24 h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                    onClick={() => {
                      setSelectedPhotoUrl(order.photoUrl);
                      setShowPhotoModal(true);
                    }}
                  />
                </div>
              </div>
            )}
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
                  <div className="mb-3">
                    <p className="font-semibold text-lg">{item.itemNumber}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.notes || '無備註'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPhotoItemId(item.id);
                        fileInputRef.current?.click();
                      }}
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
                      disabled={deleteItemMutation.isPending}
                    >
                      {deleteItemMutation.isPending ? '刪除中...' : '刪除'}
                    </Button>
                  </div>

                  {/* 照片列表 */}
                  {item.photoUrl && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">照片</p>
                      <img
                        src={item.photoUrl}
                        alt={item.itemNumber}
                        className="w-32 h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                        onClick={() => {
                          setSelectedPhotoUrl(item.photoUrl);
                          setShowPhotoModal(true);
                        }}
                      />
                    </div>
                  )}

                  {/* 編輯備註對話框 */}
                  {editingItemId === item.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded">
                      <Textarea
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        placeholder="輸入備註"
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveNotes}
                        >
                          保存
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingItemId(null);
                            setEditingNotes("");
                          }}
                        >
                          取消
                        </Button>
                      </div>
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
            <Button
              variant="outline"
              onClick={() => setShowItemDialog(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleGenerateItems}
              disabled={createItemMutation.isPending}
            >
              {createItemMutation.isPending ? '生成中...' : '生成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 照片預覽對話框 */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>照片預覽</DialogTitle>
          </DialogHeader>
          {selectedPhotoUrl && (
            <img
              src={selectedPhotoUrl}
              alt="Preview"
              className="w-full h-auto rounded"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 隱藏的文件輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        style={{ display: 'none' }}
        capture="environment"
      />

      {/* 錯誤提示 */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded">
          <div className="flex justify-between items-center">
            <p>{errorMessage}</p>
            <button onClick={() => setErrorMessage("")}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
