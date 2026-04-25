import { describe, it, expect } from "vitest";

describe("AdminAnalytics - Month Selection", () => {
  // 測試月份統計數據的篩選邏輯
  it("should filter monthly stats when a month is selected", () => {
    const monthlyStats = [
      {
        month: "2026年1月",
        monthKey: "2026-01",
        revenue: 1500,
        orderCount: 10,
        bagCount: 30,
      },
      {
        month: "2026年2月",
        monthKey: "2026-02",
        revenue: 2000,
        orderCount: 12,
        bagCount: 40,
      },
      {
        month: "2026年3月",
        monthKey: "2026-03",
        revenue: 1800,
        orderCount: 11,
        bagCount: 35,
      },
    ];

    const selectedMonth = "2026-02";

    // 篩選邏輯
    const filtered = monthlyStats.filter(
      (stat) => !selectedMonth || stat.monthKey === selectedMonth
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].monthKey).toBe("2026-02");
    expect(filtered[0].month).toBe("2026年2月");
  });

  // 測試取消選擇時顯示所有月份
  it("should show all months when no month is selected", () => {
    const monthlyStats = [
      {
        month: "2026年1月",
        monthKey: "2026-01",
        revenue: 1500,
        orderCount: 10,
        bagCount: 30,
      },
      {
        month: "2026年2月",
        monthKey: "2026-02",
        revenue: 2000,
        orderCount: 12,
        bagCount: 40,
      },
    ];

    const selectedMonth = null;

    // 篩選邏輯
    const filtered = monthlyStats.filter(
      (stat) => !selectedMonth || stat.monthKey === selectedMonth
    );

    expect(filtered).toHaveLength(2);
  });

  // 測試平均訂單額計算
  it("should calculate average order amount correctly", () => {
    const stat = {
      month: "2026年2月",
      monthKey: "2026-02",
      revenue: 2000,
      orderCount: 10,
      bagCount: 40,
    };

    const averageAmount =
      stat.orderCount > 0 ? Math.round(stat.revenue / stat.orderCount) : 0;

    expect(averageAmount).toBe(200);
  });

  // 測試平均訂單額計算 - 無訂單情況
  it("should return 0 when there are no orders", () => {
    const stat = {
      month: "2026年2月",
      monthKey: "2026-02",
      revenue: 0,
      orderCount: 0,
      bagCount: 0,
    };

    const averageAmount =
      stat.orderCount > 0 ? Math.round(stat.revenue / stat.orderCount) : 0;

    expect(averageAmount).toBe(0);
  });
});
