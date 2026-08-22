import { describe, it, expect } from "vitest";
import { businessInsights, debtAging, estimatedProfitCalc, customerRanking, stockValuation, weeklySalesSeries, dayOverDayChange } from "@/lib/analytics";
import type { Customer, Debt, Expense, Product, SaleRecord } from "@/lib/types";

const products: Product[] = [
  { id: "p1", name: "Beer", category: "Beer", bottlePrice: 20, stock: 5, reorderLevel: 10, active: true, costPrice: 12 },
  { id: "p2", name: "Whisky", category: "Spirits", bottlePrice: 200, shotPrice: 15, stock: 3, reorderLevel: 2, shotsPerBottle: 15, remainingShots: 10, active: true, costPrice: 150 }
];

const customers: Customer[] = [
  { id: "c1", name: "Kwame", phone: "0241", totalSpent: 500, debt: 100, loyaltyPoints: 50, walletBalance: 0, visitCount: 10 },
  { id: "c2", name: "Ama", phone: "0242", totalSpent: 300, debt: 50, loyaltyPoints: 30, walletBalance: 20, visitCount: 5 }
];

const sales: SaleRecord[] = [
  { id: "s1", total: 100, paymentMethod: "cash", paymentStatus: "successful", createdAt: new Date().toISOString(), lines: [{ id: "l1", productId: "p1", name: "Beer", mode: "bottle", unitPrice: 20, quantity: 5 }], discount: 0, voided: false },
  { id: "s2", total: 200, paymentMethod: "momo", paymentStatus: "successful", createdAt: new Date().toISOString(), lines: [{ id: "l2", productId: "p2", name: "Whisky", mode: "bottle", unitPrice: 200, quantity: 1 }], discount: 0, voided: false }
];

describe("businessInsights", () => {
  it("computes best seller by units", () => {
    const result = businessInsights(products, customers, sales);
    expect(result.bestSeller?.id).toBe("p1");
    expect(result.bestSeller?.units).toBe(5);
  });

  it("computes total sales excluding voided", () => {
    const voidedSales = [...sales, { ...sales[0], id: "s3", voided: true }];
    const result = businessInsights(products, customers, voidedSales);
    expect(result.totalSales).toBe(300);
  });

  it("identifies low stock products", () => {
    const result = businessInsights(products, customers, sales);
    expect(result.lowStock.length).toBe(1);
    expect(result.lowStock[0].id).toBe("p1");
  });

  it("computes payment mix", () => {
    const result = businessInsights(products, customers, sales);
    expect(result.paymentMix["cash"]).toBe(100);
    expect(result.paymentMix["momo"]).toBe(200);
  });
});

describe("debtAging", () => {
  const debts: Debt[] = [
    { id: "d1", customerId: "c1", customerName: "Kwame", originalAmount: 100, outstandingAmount: 100, createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), payments: [] },
    { id: "d2", customerId: "c2", customerName: "Ama", originalAmount: 50, outstandingAmount: 50, createdAt: new Date(Date.now() - 50 * 86400000).toISOString(), payments: [] }
  ];

  it("buckets current debt correctly", () => {
    const result = debtAging(debts);
    expect(result.current).toBe(100);
    expect(result.days30).toBe(50);
  });

  it("marks overdue debt", () => {
    const overdueDebts: Debt[] = [
      { id: "d3", customerId: "c1", customerName: "Kwame", originalAmount: 200, outstandingAmount: 200, createdAt: new Date(Date.now() - 40 * 86400000).toISOString(), dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10), payments: [] }
    ];
    const result = debtAging(overdueDebts);
    expect(result.overdue).toBe(200);
  });
});

describe("estimatedProfitCalc", () => {
  it("calculates profit as revenue minus COGS minus expenses", () => {
    const expenses: Expense[] = [
      { id: "e1", title: "Ice", amount: 30, category: "supplies", createdAt: new Date().toISOString() }
    ];
    const profit = estimatedProfitCalc(sales, expenses, products);
    const revenue = 300;
    const cogs = 5 * 12 + 1 * 150;
    const expenseTotal = 30;
    expect(profit).toBe(revenue - cogs - expenseTotal);
  });
});

describe("customerRanking", () => {
  it("sorts customers by total spent descending", () => {
    const ranked = customerRanking(customers);
    expect(ranked[0].id).toBe("c1");
    expect(ranked[1].id).toBe("c2");
  });
});

describe("stockValuation", () => {
  it("values stock at cost price", () => {
    const value = stockValuation(products);
    expect(value).toBe(5 * 12 + 3 * 150);
  });
});

describe("high-stock detection", () => {
  it("identifies products with unusually high stock", () => {
    const highStockProducts: Product[] = [
      { id: "p1", name: "Beer", category: "Beer", bottlePrice: 20, stock: 100, reorderLevel: 10, active: true },
      { id: "p2", name: "Whisky", category: "Spirits", bottlePrice: 200, stock: 5, reorderLevel: 2, active: true },
      { id: "p3", name: "Wine", category: "Wine", bottlePrice: 150, stock: 3, reorderLevel: 4, active: true }
    ];
    const result = businessInsights(highStockProducts, customers, sales);
    expect(result.highStock[0].id).toBe("p1");
  });
});

describe("least-selling product calculation", () => {
  it("identifies the product with the fewest units sold", () => {
    const salesWithBoth: SaleRecord[] = [
      { id: "s1", total: 100, paymentMethod: "cash", paymentStatus: "successful", createdAt: new Date().toISOString(), lines: [{ id: "l1", productId: "p1", name: "Beer", mode: "bottle", unitPrice: 20, quantity: 10 }], discount: 0, voided: false },
      { id: "s2", total: 200, paymentMethod: "momo", paymentStatus: "successful", createdAt: new Date().toISOString(), lines: [{ id: "l2", productId: "p2", name: "Whisky", mode: "bottle", unitPrice: 200, quantity: 1 }], discount: 0, voided: false }
    ];
    const result = businessInsights(products, customers, salesWithBoth);
    expect(result.leastSeller?.id).toBe("p2");
    expect(result.leastSeller?.units).toBe(1);
  });

  it("identifies slow-moving products with zero sales", () => {
    const unsoldProducts: Product[] = [
      ...products,
      { id: "p3", name: "Coke", category: "Soft Drinks", bottlePrice: 10, stock: 20, reorderLevel: 5, active: true }
    ];
    const result = businessInsights(unsoldProducts, customers, sales);
    expect(result.slowMoving.some((p) => p.id === "p3")).toBe(true);
  });
});

describe("highest debtor calculation", () => {
  it("identifies the customer with the highest debt", () => {
    const result = businessInsights(products, customers, sales);
    expect(result.topDebtor?.id).toBe("c1");
    expect(result.topDebtor?.debt).toBe(100);
  });

  it("returns the correct debtor when debts change", () => {
    const customersWithDebt: Customer[] = [
      { id: "c1", name: "Kwame", phone: "0241", totalSpent: 500, debt: 50, loyaltyPoints: 50, walletBalance: 0, visitCount: 10 },
      { id: "c2", name: "Ama", phone: "0242", totalSpent: 300, debt: 200, loyaltyPoints: 30, walletBalance: 20, visitCount: 5 }
    ];
    const result = businessInsights(products, customersWithDebt, sales);
    expect(result.topDebtor?.id).toBe("c2");
    expect(result.topDebtor?.debt).toBe(200);
  });
});

describe("weeklySalesSeries", () => {
  it("returns 7 data points for the last 7 days", () => {
    const result = weeklySalesSeries(sales);
    expect(result.length).toBe(7);
  });

  it("includes today's sales in the last bucket", () => {
    const todaySales: SaleRecord[] = [
      { id: "s1", total: 500, paymentMethod: "cash", paymentStatus: "successful", createdAt: new Date().toISOString(), lines: [], discount: 0, voided: false }
    ];
    const result = weeklySalesSeries(todaySales);
    expect(result[6].value).toBe(500);
  });

  it("excludes voided sales", () => {
    const voidedSales: SaleRecord[] = [
      { id: "s1", total: 500, paymentMethod: "cash", paymentStatus: "successful", createdAt: new Date().toISOString(), lines: [], discount: 0, voided: true }
    ];
    const result = weeklySalesSeries(voidedSales);
    expect(result[6].value).toBe(0);
  });

  it("places older sales in the correct day bucket", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    const olderSales: SaleRecord[] = [
      { id: "s1", total: 300, paymentMethod: "cash", paymentStatus: "successful", createdAt: threeDaysAgo, lines: [], discount: 0, voided: false }
    ];
    const result = weeklySalesSeries(olderSales);
    const total = result.reduce((sum, d) => sum + d.value, 0);
    expect(total).toBe(300);
    expect(result[6].value).toBe(0);
  });
});

describe("estimatedProfitCalc — shot COGS proration", () => {
  it("prorates COGS for shot sales by shotsPerBottle", () => {
    const shotSales: SaleRecord[] = [
      {
        id: "s-shot", total: 120, paymentMethod: "cash", paymentStatus: "successful",
        createdAt: new Date().toISOString(),
        lines: [{ id: "l1", productId: "p2", name: "Whisky", mode: "shot", unitPrice: 15, quantity: 8 }],
        discount: 0, voided: false
      }
    ];
    const noExpenses: Expense[] = [];
    const profit = estimatedProfitCalc(shotSales, noExpenses, products);
    // Revenue: 8 shots × 15 = 120
    // COGS: (150 / 15 shots) × 8 = 80
    // Profit: 120 - 80 - 0 = 40
    expect(profit).toBe(40);
  });

  it("uses full bottle cost for bottle sales", () => {
    const bottleSales: SaleRecord[] = [
      {
        id: "s-bottle", total: 200, paymentMethod: "cash", paymentStatus: "successful",
        createdAt: new Date().toISOString(),
        lines: [{ id: "l1", productId: "p2", name: "Whisky", mode: "bottle", unitPrice: 200, quantity: 1 }],
        discount: 0, voided: false
      }
    ];
    const noExpenses: Expense[] = [];
    const profit = estimatedProfitCalc(bottleSales, noExpenses, products);
    // Revenue: 200, COGS: 150, Profit: 50
    expect(profit).toBe(50);
  });

  it("handles mixed bottle and shot sales", () => {
    const mixedSales: SaleRecord[] = [
      {
        id: "s-mixed", total: 260, paymentMethod: "cash", paymentStatus: "successful",
        createdAt: new Date().toISOString(),
        lines: [
          { id: "l1", productId: "p1", name: "Beer", mode: "bottle", unitPrice: 20, quantity: 4 },
          { id: "l2", productId: "p2", name: "Whisky", mode: "shot", unitPrice: 15, quantity: 12 }
        ],
        discount: 0, voided: false
      }
    ];
    const noExpenses: Expense[] = [];
    const profit = estimatedProfitCalc(mixedSales, noExpenses, products);
    // Revenue: 4×20 + 12×15 = 80 + 180 = 260
    // COGS: 4×12 + (150/15)×12 = 48 + 120 = 168
    // Profit: 260 - 168 = 92
    expect(profit).toBe(92);
  });

  it("subtracts expenses from profit", () => {
    const expenses: Expense[] = [
      { id: "e1", title: "Electricity", amount: 30, category: "utilities", createdAt: new Date().toISOString() }
    ];
    const bottleSales: SaleRecord[] = [
      {
        id: "s1", total: 200, paymentMethod: "cash", paymentStatus: "successful",
        createdAt: new Date().toISOString(),
        lines: [{ id: "l1", productId: "p2", name: "Whisky", mode: "bottle", unitPrice: 200, quantity: 1 }],
        discount: 0, voided: false
      }
    ];
    const profit = estimatedProfitCalc(bottleSales, expenses, products);
    // Revenue: 200, COGS: 150, Expenses: 30, Profit: 20
    expect(profit).toBe(20);
  });
});

describe("dayOverDayChange", () => {
  const mk = (total: number, daysAgo: number, qty = 1): SaleRecord => ({
    id: `s-${total}-${daysAgo}`,
    total,
    paymentMethod: "cash",
    paymentStatus: "successful",
    createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    lines: [{ id: `l-${total}-${daysAgo}`, productId: "p1", name: "Beer", mode: "bottle", unitPrice: total, quantity: qty }],
    discount: 0,
    voided: false
  });

  it("computes an upward revenue trend", () => {
    // Yesterday's sale is anchored mid-day so it cannot spill into today.
    const yesterday = mk(100, 1);
    yesterday.createdAt = new Date(new Date().setHours(0, 0, 0, 0) - 43200000).toISOString();
    const result = dayOverDayChange([mk(150, 0), yesterday], "revenue");
    expect(result.today).toBe(150);
    expect(result.yesterday).toBe(100);
    expect(result.percent).toBeCloseTo(50);
    expect(result.up).toBe(true);
  });

  it("computes a downward revenue trend", () => {
    const yesterday = mk(200, 1);
    yesterday.createdAt = new Date(new Date().setHours(0, 0, 0, 0) - 43200000).toISOString();
    const result = dayOverDayChange([mk(100, 0), yesterday], "revenue");
    expect(result.percent).toBeCloseTo(-50);
    expect(result.up).toBe(false);
  });

  it("reports 100% when there was no baseline yesterday", () => {
    const result = dayOverDayChange([mk(80, 0)], "revenue");
    expect(result.yesterday).toBe(0);
    expect(result.percent).toBe(100);
    expect(result.up).toBe(true);
  });

  it("reports a flat 0% when there is no activity at all", () => {
    const result = dayOverDayChange([], "revenue");
    expect(result.today).toBe(0);
    expect(result.percent).toBe(0);
    expect(result.up).toBe(false);
  });

  it("counts units instead of revenue when asked", () => {
    const result = dayOverDayChange([mk(50, 0, 4)], "units");
    expect(result.today).toBe(4);
  });

  it("ignores voided sales", () => {
    const voided = mk(500, 0);
    voided.voided = true;
    const result = dayOverDayChange([mk(100, 0), voided], "revenue");
    expect(result.today).toBe(100);
  });
});

describe("businessInsights ranked list", () => {
  it("exposes products ranked by units sold", () => {
    const insights = businessInsights(products, customers, sales);
    expect(insights.ranked).toHaveLength(products.length);
    expect(insights.ranked[0].units).toBeGreaterThanOrEqual(insights.ranked[1].units);
  });

  it("ranks the best seller first", () => {
    const insights = businessInsights(products, customers, sales);
    expect(insights.ranked[0].id).toBe(insights.bestSeller.id);
  });
});
