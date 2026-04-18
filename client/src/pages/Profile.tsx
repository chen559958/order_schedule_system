import { useState, useEffect } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function Profile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 獲取用戶資料
  useEffect(() => {
    if (user) {
      setFullName(user.name || "");
      setAddress(user.address || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  // 更新個人資料 mutation
  const updateProfileMutation = trpc.customer.updateProfile.useMutation({
    onSuccess: () => {
      alert("個人資訊已更新");
      setIsEditing(false);
    },
    onError: (error) => {
      alert(`更新失敗: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !address.trim() || !phone.trim()) {
      alert("請填寫所有欄位");
      return;
    }

    setIsSaving(true);
    await updateProfileMutation.mutateAsync({
      fullName,
      address,
      phone,
    });
    setIsSaving(false);
  };

  return (
    <CustomerLayout>
      <div className="space-y-8 max-w-2xl">
        {/* 頁面標題 */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">個人資料</h1>
          <p className="text-gray-600">查看和修改您的個人資訊</p>
        </div>

        {/* 個人資料卡片 */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">基本資訊</CardTitle>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                className={`${
                  isEditing
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isEditing ? "取消編輯" : "編輯資料"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 姓名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="請輸入姓名"
                    className="border-gray-300"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {fullName || "未設定"}
                  </div>
                )}
              </div>

              {/* 電話 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話
                </label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="請輸入電話"
                    className="border-gray-300"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {phone || "未設定"}
                  </div>
                )}
              </div>

              {/* 地址 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  地址
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="請輸入地址"
                    className="border-gray-300"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {address || "未設定"}
                  </div>
                )}
              </div>

              {/* 提交按鈕 */}
              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSaving || updateProfileMutation.isPending}
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isSaving || updateProfileMutation.isPending ? "保存中..." : "保存修改"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* 帳戶資訊 */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">帳戶資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">電子郵件</p>
              <p className="text-gray-900 font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">帳戶類型</p>
              <p className="text-gray-900 font-medium">客戶</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}
