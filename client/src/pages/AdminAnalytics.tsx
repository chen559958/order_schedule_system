import { useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function AdminAnalytics() {
  // 獲取所有訂單
  const { data: allOrders = [], isLoading } = trpc.order.getAll.useQuery();

  // 計算月份統計（只統計已完成的訂單）
  const monthlyStats = useMemo(() => {
    const stats: Record<string, { revenue: number; orderCount: number; bagCount: number }> = {};

    allOrders.forEach((order: any) => {
      // 只統計已完成的訂單（progress === 'completed'）
      if (!order.createdAt || order.progress !== 'completed') return;
      
      // 提取月份（YYYY-MM）
      const dateStr = order.createdAt.split(' ')[0] || order.createdAt.split('T')[0];
      const monthKey = dateStr.substring(0, 7); // YYYY-MM
      
      if (!stats[monthKey]) {
        stats[monthKey] = { revenue: 0, orderCount: 0, bagCount: 0 };
      }
      
      stats[monthKey].revenue += order.bagCount * 150;
      stats[monthKey].orderCount += 1;
      stats[monthKey].bagCount += order.bagCount;
    });

    // 轉換為陣列並排序
    return Object.entries(stats)
      .map(([month, data]) => ({
        month: `${month.substring(0, 4)}年${parseInt(month.substring(5))}月`,
        monthKey: month,
        ...data,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [allOrders]);

  // 計算總體統計
  const totalStats = useMemo(() => {
    const total = {
      revenue: 0,
      orderCount: 0,
      bagCount: 0,
    };

    monthlyStats.forEach((stat) => {
      total.revenue += stat.revenue;
      total.orderCount += stat.orderCount;
      total.bagCount += stat.bagCount;
    });

    return {
      ...total,
      averageRevenue: monthlyStats.length > 0 ? Math.round(total.revenue / monthlyStats.length) : 0,
    };
  }, [monthlyStats]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">營業概況</h1>
          <p className="text-gray-400">查看營業統計和分析</p>
        </div>

        {/* 總體統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <p className="text-gray-400 text-sm mb-2">總營業額</p>
              <p className="text-3xl font-bold text-white">NT${totalStats.revenue}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <p className="text-gray-400 text-sm mb-2">平均月營業額</p>
              <p className="text-3xl font-bold text-white">NT${totalStats.averageRevenue}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <p className="text-gray-400 text-sm mb-2">總訂單數</p>
              <p className="text-3xl font-bold text-white">{totalStats.orderCount}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <p className="text-gray-400 text-sm mb-2">總袋數</p>
              <p className="text-3xl font-bold text-white">{totalStats.bagCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* 月份統計表 */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">月份統計</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-gray-400">載入中...</div>
            ) : monthlyStats.length === 0 ? (
              <div className="text-center text-gray-500 py-8">暫無訂單數據</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 text-gray-400">月份</th>
                      <th className="text-left py-3 px-4 text-gray-400">營業額</th>
                      <th className="text-left py-3 px-4 text-gray-400">訂單數</th>
                      <th className="text-left py-3 px-4 text-gray-400">袋數</th>
                      <th className="text-left py-3 px-4 text-gray-400">平均訂單額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyStats.map((stat, index) => (
                      <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-white">{stat.month}</td>
                        <td className="py-3 px-4 text-white font-semibold">NT${stat.revenue}</td>
                        <td className="py-3 px-4 text-gray-300">{stat.orderCount}</td>
                        <td className="py-3 px-4 text-gray-300">{stat.bagCount}</td>
                        <td className="py-3 px-4 text-gray-300">
                          NT${stat.orderCount > 0 ? Math.round(stat.revenue / stat.orderCount) : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 趨勢分析 */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">營業趨勢</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyStats.length === 0 ? (
              <div className="text-center text-gray-500 py-8">暫無訂單數據</div>
            ) : (
              <div className="space-y-4">
                {monthlyStats.map((stat, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">{stat.month}</span>
                      <span className="text-white font-semibold">NT${stat.revenue}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${
                            monthlyStats.length > 0
                              ? (stat.revenue / Math.max(...monthlyStats.map((s) => s.revenue))) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
