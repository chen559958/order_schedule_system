import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage({ type: "error", text: "請輸入帳號和密碼" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      console.log("開始登入，帳號:", email);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log("登入回應:", data);

      if (response.ok && data.id) {
        console.log("登入成功，用戶資料:", data);
        
        // 調用 login 更新 localStorage 和 useAuth 狀態
        login(data);
        
        console.log("已保存用戶資料到 localStorage，準備跳轉");
        console.log("用戶角色:", data.role);

        // 延遲跳轉以確保狀態更新
        setTimeout(() => {
          console.log("執行跳轉邏輯");
          // 將角色轉換為大寫以進行比較
          const roleUpper = (data.role || "").toUpperCase();
          if (roleUpper === "ADMIN") {
            console.log("跳轉到管理員儀表板");
            setLocation("/admin/dashboard");
          } else if (roleUpper === "STAFF") {
            console.log("跳轉到員工排程");
            setLocation("/staff/schedule");
          } else {
            console.log("跳轉到客戶訂單頁面");
            setLocation("/orders");
          }
        }, 100);
      } else {
        console.error("登入失敗:", data);
        setMessage({ type: "error", text: data.error || "登入失敗" });
      }
    } catch (error) {
      console.error("登入異常:", error);
      setMessage({ type: "error", text: "登入失敗，請稍後重試" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !confirmPassword.trim() || !fullName.trim()) {
      setMessage({ type: "error", text: "請填寫所有欄位" });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "密碼不相符" });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: "error", text: "密碼至少需要 6 個字符" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: fullName })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "註冊成功，請登入" });
        setMode("login");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFullName("");
      } else {
        setMessage({ type: "error", text: data.error || "註冊失敗" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "註冊失敗，請稍後重試" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white">LAUNDRY</CardTitle>
          <CardDescription className="text-slate-400">洗衣物流管理系統</CardDescription>
        </CardHeader>

        <CardContent>
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === "error"
                  ? "bg-red-900 text-red-200"
                  : "bg-green-900 text-green-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-slate-300">
                  帳號
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="請輸入帳號"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-300">
                  密碼
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "登入中..." : "登入"}
              </Button>

              <div className="text-center text-sm text-slate-400 space-x-2">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="hover:text-slate-300"
                >
                  忘記密碼
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="hover:text-slate-300"
                >
                  註冊會員
                </button>
              </div>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-slate-300">
                  姓名
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="請輸入姓名"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="regEmail" className="text-slate-300">
                  帳號（Email）
                </Label>
                <Input
                  id="regEmail"
                  type="email"
                  placeholder="請輸入帳號"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="regPassword" className="text-slate-300">
                  密碼 (至少 6 個字母)
                </Label>
                <Input
                  id="regPassword"
                  type="password"
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  確認密碼
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="請再次輸入密碼"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "註冊中..." : "註冊"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-sm text-slate-400 hover:text-slate-300"
                >
                  返回登入
                </button>
              </div>
            </form>
          )}

          {mode === "forgot" && (
            <div className="space-y-4">
              <p className="text-slate-300">忘記密碼功能即將推出</p>
              <Button
                onClick={() => setMode("login")}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white"
              >
                返回登入
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
