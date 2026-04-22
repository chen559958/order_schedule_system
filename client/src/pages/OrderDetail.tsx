import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
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

interface OrderItem {
  id: number;
  orderId: number;
  itemNumber: string;
  notes: string | null;
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
  const { orderNumber } = useParams<{ orderNumber: string }>();
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

  // 直接按訂單編號查詢訂單
  const { data: queriedOrder, isLoading: orderLoading } = trpc.order.getByOrderNumber.useQuery(
    { orderNumber: orderNumber || "" },
    { enabled: !!orderNumber && !userLoading }
  );

  // 獲取訂單項目
  const { data: orderItems, refetch: refetchOrderItems } = trpc.orderItem.getByOrderId.useQuery(
    { orderId: order?.id || 0 },
    { enabled: !!order?.id }
  );

  // 創建訂單項目 mutation
  const createItemMutation = trpc.orderItem.create.useMutation({
    onSuccess: () => {
      setItemCount(0);
      refetchOrderItems();
    },
    onError: (error) => {
      console.error("Failed to create item:", error);
      alert("創建衣物編號失敗，請重試");
    },
  });

  // 更新訂單項目 mutation
  const updateItemMutation = trpc.orderItem.update.useMutation({
    onSuccess: () => {
      setShowItemDialog(false);
      setEditingItemId(null);
      setEditingNotes("");
      refetchOrderItems();
    },
    onError: (error) => {
      console.error("Failed to update item:", error);
      alert("更新衣物備註失敗，請重試");
    },
  });

  // 刪除訂單項目 mutation
  const deleteItemMutation = trpc.orderItem.delete.useMutation({
    onSuccess: () => {
      refetchOrderItems();
    },
    onError: (error) => {
      console.error("Failed to delete item:", error);
      alert("刪除衣物失敗，請重試");
    },
  });

  // 當訂單項目改變時，更新本地狀態
  useEffect(() => {
    if (orderItems) {
      setItems(orderItems);
    }
  }, [orderItems]);

  // 當查詢到訂單時，更新狀態
  useEffect(() => {
    if (queriedOrder) {
      setOrder(queriedOrder);
      setIsLoading(false);
    } else if (!orderLoading && orderNumber) {
      setIsLoading(false);
    }
  }, [queriedOrder, orderLoading, orderNumber]);

  // 生成衣物編號
  const generateItemNumbers = () => {
    if (!order || itemCount <= 0) return;

    const baseNumber = order.orderNumber; // 例如: 260421-01
    const existingCount = items.length; // 現有項目數

    // 根據現有項目數續號
    for (let i = 1; i <= itemCount; i++) {
      const itemNumber = `${baseNumber}-${String(existingCount + i).padStart(2, "0")}`; // 例如: 260421-01-01
      createItemMutation.mutate({
        orderId: order.id,
        itemNumber,
      });
    }
  };

  // 編輯項目備註
  const handleEditItem = (item: OrderItem) => {
    setEditingItemId(item.id);
    setEditingNotes(item.notes || "");
    setShowItemDialog(true);
  };

  // 保存項目備註
  const handleSaveItem = () => {
    if (editingItemId !== null) {
      updateItemMutation.mutate({
        itemId: editingItemId,
        notes: editingNotes,
      });
    }
  };

  // 刪除項目
  const handleDeleteItem = (itemId: number) => {
    if (confirm("確認要刪除此項目嗎？")) {
      deleteItemMutation.mutate({ itemId });
    }
  };

  if (isLoading || userLoading || orderLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>載入中...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">找不到訂單</p>
          <Button onClick={() => setLocation("/")} variant="outline">
            返回
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
          </CardContent>
        </Card>

        {/* 衣物編號列表 */}
        {items.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-sm">
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
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-1">備註：{item.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        備註
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        variant="destructive"
                        className="bg-red-600 text-white hover:bg-red-700"
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

        {/* 備註編輯對話框 */}
        <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>編輯衣物備註</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="請輸入備註內容"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setShowItemDialog(false)}
                variant="outline"
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={handleSaveItem}
                disabled={updateItemMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {updateItemMutation.isPending ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
