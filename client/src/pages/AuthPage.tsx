import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: profile, isLoading: isLoadingProfile } = trpc.customer.getProfile.useQuery(
    undefined,
    { enabled: !!user }
  );
  const updateProfileMutation = trpc.customer.updateProfile.useMutation();

  // If user is logged in and has completed profile, redirect to home
  useEffect(() => {
    if (user && profile && profile.fullName && profile.address && profile.phone) {
      setLocation("/");
    }
  }, [user, profile, setLocation]);

  // If user is not logged in, show login page
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-black text-gray-100">登入系統</CardTitle>
              <CardDescription className="text-gray-400">
                使用 Manus 帳號登入
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold py-6 text-lg"
              >
                使用 Manus 登入
              </Button>
              <p className="text-gray-400 text-sm text-center mt-4">
                首次登入後，系統將引導您填寫個人資訊
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If loading, show loading state
  if (loading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  // If user is logged in but hasn't completed profile, show profile completion form
  if (user && (!profile || !profile.fullName || !profile.address || !profile.phone)) {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!fullName.trim() || !address.trim() || !phone.trim()) {
        toast.error("請填寫所有欄位");
        return;
      }

      setIsSubmitting(true);
      try {
        await updateProfileMutation.mutateAsync({
          fullName,
          address,
          phone,
        });
        toast.success("個人資訊已保存！");
        setLocation("/");
      } catch (error) {
        toast.error("保存失敗，請稍後重試");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-black text-gray-100">
                完成個人資訊
              </CardTitle>
              <CardDescription className="text-gray-400">
                首次登入需要填寫您的基本資訊
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-300">
                    姓名 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="請輸入您的姓名"
                    className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-300">
                    地址 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="請輸入您的地址"
                    className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">
                    電話 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="請輸入您的電話號碼"
                    className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || updateProfileMutation.isPending}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold py-6 text-lg mt-6"
                >
                  {isSubmitting || updateProfileMutation.isPending ? "保存中..." : "完成並繼續"}
                </Button>
              </form>

              <p className="text-gray-400 text-xs text-center mt-4">
                這些資訊將用於訂單配送，您可以稍後在個人資訊頁面修改
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If user is logged in and has completed profile, redirect to home
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400">重新導向中...</div>
    </div>
  );
}
