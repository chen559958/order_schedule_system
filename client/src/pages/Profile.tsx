import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: profile, isLoading: isLoadingProfile } = trpc.customer.getProfile.useQuery();
  const updateMutation = trpc.customer.updateProfile.useMutation();

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setAddress(profile.address);
      setPhone(profile.phone);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !address.trim() || !phone.trim()) {
      toast.error("請填寫所有欄位");
      return;
    }

    setIsLoading(true);
    try {
      await updateMutation.mutateAsync({
        fullName,
        address,
        phone,
      });
      toast.success("個人資訊已更新");
    } catch (error) {
      toast.error("更新失敗，請稍後重試");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-gray-100">個人資訊</CardTitle>
            <CardDescription className="text-gray-400">管理您的帳戶資訊</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  姓名
                </Label>
                <Input
                  id="name"
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

              <Button
                type="submit"
                disabled={isLoading || updateMutation.isPending}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold"
              >
                {isLoading || updateMutation.isPending ? "保存中..." : "保存"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
