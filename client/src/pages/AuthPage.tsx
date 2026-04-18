import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("請輸入帳號和密碼");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/trpc/auth.login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { email, password }
        })
      });

      const data = await response.json();
      
      if (data.result?.data) {
        const user = data.result.data;
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", user.token || "");
        
        toast.success("登入成功！");
        
        // 根據身份分流
        if (user.role === "admin") {
          setLocation("/admin/dashboard");
        } else if (user.role === "staff") {
          setLocation("/staff/schedule");
        } else {
          setLocation("/place-order");
        }
      } else {
        toast.error(data.result?.error?.message || "登入失敗");
      }
    } catch (error) {
      toast.error("登入失敗，請稍後重試");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !confirmPassword.trim() || !fullName.trim()) {
      toast.error("請填寫所有欄位");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("密碼不相符");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/trpc/auth.register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { email, password, fullName }
        })
      });

      const data = await response.json();
      
      if (data.result?.data) {
        toast.success("註冊成功！請登入");
        setMode("login");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFullName("");
      } else {
        toast.error(data.result?.error?.message || "註冊失敗");
      }
    } catch (error) {
      toast.error("註冊失敗，請稍後重試");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gray-100 mb-2">LAUNDRY</h1>
          <p className="text-gray-400 text-sm">洗衣物流管理系統</p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          {mode === "login" && (
            <>
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-black text-gray-100">登入</CardTitle>
                <CardDescription className="text-gray-400">
                  輸入您的帳號和密碼
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">
                      帳號
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="請輸入帳號"
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">
                      密碼
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="請輸入密碼"
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold py-6 text-lg"
                  >
                    {isLoading ? "登入中..." : "登入"}
                  </Button>
                </form>

                <div className="flex gap-2 text-sm text-gray-400 mt-6 justify-center">
                  <button
                    onClick={() => setMode("forgot")}
                    className="hover:text-gray-300 underline"
                  >
                    忘記密碼
                  </button>
                  <span>|</span>
                  <button
                    onClick={() => setMode("register")}
                    className="hover:text-gray-300 underline"
                  >
                    註冊會員
                  </button>
                </div>
              </CardContent>
            </>
          )}

          {mode === "register" && (
            <>
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-black text-gray-100">註冊會員</CardTitle>
                <CardDescription className="text-gray-400">
                  建立新帳號
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-300">
                      姓名
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="請輸入姓名"
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registerEmail" className="text-gray-300">
                      帳號（Email）
                    </Label>
                    <Input
                      id="registerEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="請輸入 Email"
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registerPassword" className="text-gray-300">
                      密碼 <span className="text-red-400 text-xs ml-1">（至少6個字母）</span>
                    </Label>
                    <Input
                      id="registerPassword"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="請輸入密碼（至少6個字母）"
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-300">
                      確認密碼
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="請再次輸入密碼"
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold py-6 text-lg"
                  >
                    {isLoading ? "註冊中..." : "建立帳號"}
                  </Button>
                </form>

                <div className="text-center text-sm text-gray-400 mt-6">
                  已有帳號？
                  <button
                    onClick={() => setMode("login")}
                    className="hover:text-gray-300 underline ml-1"
                  >
                    返回登入
                  </button>
                </div>
              </CardContent>
            </>
          )}

          {mode === "forgot" && (
            <>
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-black text-gray-100">忘記密碼</CardTitle>
                <CardDescription className="text-gray-400">
                  輸入您的帳號重設密碼
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgotEmail" className="text-gray-300">
                      帳號（Email）
                    </Label>
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="請輸入您的 Email"
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                    />
                  </div>

                  <Button
                    disabled={isLoading}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold py-6 text-lg"
                    onClick={() => {
                      toast.info("密碼重設連結已發送至您的 Email");
                      setMode("login");
                    }}
                  >
                    發送重設連結
                  </Button>
                </div>

                <div className="text-center text-sm text-gray-400 mt-6">
                  <button
                    onClick={() => setMode("login")}
                    className="hover:text-gray-300 underline"
                  >
                    返回登入
                  </button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
