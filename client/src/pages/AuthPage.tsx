import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const showAlert = (title: string, description: string, isError: boolean = false) => {
  if (isError) {
    alert(`❌ ${title}\n${description}`);
  } else {
    alert(`✅ ${title}\n${description}`);
  }
};

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showAlert("錯誤", "請輸入帳號和密碼", true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (response.ok && data.id) {
        // 先登入（更新 localStorage）
        login(data);
        
        // 延遲跳轉以確保狀態更新
        setTimeout(() => {
          // 根據身份分流
          if (data.role === "ADMIN" || data.role === "admin") {
            setLocation("/admin/dashboard");
          } else if (data.role === "STAFF" || data.role === "staff") {
            setLocation("/staff/schedule");
          } else {
            setLocation("/orders");
          }
        }, 100)
      } else {
        showAlert("錯誤", data.error || "登入失敗", true);
      }
    } catch (error) {
      showAlert("錯誤", "登入失敗，請稍後重試", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !confirmPassword.trim() || !fullName.trim()) {
      showAlert("錯誤", "請填寫所有欄位", true);
      return;
    }

    if (password !== confirmPassword) {
      showAlert("錯誤", "密碼不相符", true);
      return;
    }

    if (password.length < 6) {
      showAlert("錯誤", "密碼至少需要6個字符", true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, password, fullName
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        showAlert("成功", "註冊成功！請登入");
        setMode("login");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFullName("");
      } else {
        showAlert("錯誤", data.error || "註冊失敗", true);
      }
    } catch (error) {
      showAlert("錯誤", "註冊失敗，請稍後重試", true);
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

        {/* Card */}
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
                    {isLoading ? "註冊中..." : "註冊"}
                  </Button>
                </form>

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

          {mode === "forgot" && (
            <>
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-black text-gray-100">忘記密碼</CardTitle>
                <CardDescription className="text-gray-400">
                  請輸入您的 Email
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
                      placeholder="請輸入 Email"
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                    />
                  </div>

                  <Button
                    disabled={isLoading}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold py-6 text-lg"
                  >
                    {isLoading ? "發送中..." : "發送重設連結"}
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
