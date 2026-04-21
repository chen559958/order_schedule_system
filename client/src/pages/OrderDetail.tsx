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

  // 獲取訂單信息
  const { data: allOrders } = trpc.order.getAll.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const { data: myOrders } = trpc.order.getMyOrders.useQuery(undefined, {
    enabled: user?.role === "user",
  });

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

  // 初始化頁面 - 查找訂單
  useEffect(() => {
    if (userLoading) return;

    let foundOrder = null;

    if (user?.role === "admin" && allOrders) {
      foundOrder = allOrders.find((o: any) => o.orderNumber === orderNumber);
    } else if (user?.role === "user" && myOrders) {
      foundOrder = myOrders.find((o: any) => o.orderNumber === orderNumber);
    }

    if (foundOrder) {
      setOrder(foundOrder);
    }

    setIsLoading(false);
  }, [orderNumber, user, allOrders, myOrders, userLoading]);

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

  if (isLoading || userLoading) {
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

        {/* 訂單信息卡片 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">訂單詳細 - {order.orderNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">訂單編號</p>
                <p className="text-lg font-semibold">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">袋數</p>
                <p className="text-lg font-semibold">{order.bagCount}</p>
              </div>
              {order.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">備註</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 衣物管理卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>衣物管理</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 生成衣物編號區塊 */}
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-sm font-semibold mb-3">生成衣物編號</h3>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-sm text-gray-600">衣物件數</label>
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    value={itemCount}
                    onChange={(e) => setItemCount(parseInt(e.target.value) || 0)}
                    placeholder="輸入件數"
                  />
                </div>
                <Button
                  onClick={generateItemNumbers}
                  disabled={itemCount <= 0 || createItemMutation.isPending}
                >
                  {createItemMutation.isPending ? "生成中..." : "生成編號"}
                </Button>
              </div>
            </div>

            {/* 衣物列表 */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold mb-3">衣物列表</h3>
              {items && items.length > 0 ? (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.itemNumber}</p>
                        {item.notes && (
                          <p className="text-sm text-gray-600">{item.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditItem(item)}
                        >
                          編輯
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deleteItemMutation.isPending}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  尚未添加衣物，請先輸入件數並生成編號
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 編輯項目備註對話框 */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯衣物備註</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">衣物編號</p>
              <p className="text-sm text-gray-600">
                {items.find((i) => i.id === editingItemId)?.itemNumber}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold">備註</label>
              <Textarea
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="輸入衣物備註（如：特殊處理、損傷等）"
                rows={4}
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
              onClick={handleSaveItem}
              disabled={updateItemMutation.isPending}
            >
              {updateItemMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
