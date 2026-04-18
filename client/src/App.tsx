import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import PlaceOrder from "./pages/PlaceOrder";
import MyOrders from "./pages/MyOrders";
import AdminDashboard from "./pages/AdminDashboard";
import StaffSchedule from "./pages/StaffSchedule";
import AuthPage from "./pages/AuthPage";
import { useAuth } from "./_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

function Router() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user && ["/profile", "/place-order", "/orders", "/admin/dashboard", "/staff/schedule"].includes(location)) {
      setLocation("/auth");
    }
  }, [user, loading, location, setLocation]);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/profile" component={Profile} />
      <Route path="/place-order" component={PlaceOrder} />
      <Route path="/orders" component={MyOrders} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/staff/schedule" component={StaffSchedule} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
