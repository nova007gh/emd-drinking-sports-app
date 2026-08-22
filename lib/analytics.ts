import type { Customer, Debt, Expense, Product, SaleRecord } from "./types";
import { isLowStock } from "./domain/inventory";

export function businessInsights(products: Product[], customers: Customer[], sales: SaleRecord[]) {
  const productUnits = new Map<string, number>();
  const productRevenue = new Map<string, number>();

  sales.forEach((sale) => {
    if (sale.voided) return;
    sale.lines.forEach((line) => {
      productUnits.set(line.productId, (productUnits.get(line.productId) ?? 0) + line.quantity);
      productRevenue.set(line.productId, (productRevenue.get(line.productId) ?? 0) + line.unitPrice * line.quantity);
    });
  });

  const ranked = products
    .map((p) => ({ ...p, units: productUnits.get(p.id) ?? 0, revenue: productRevenue.get(p.id) ?? 0 }))
    .sort((a, b) => b.units - a.units);

  const topBuyer = [...customers].sort((a, b) => b.totalSpent - a.totalSpent)[0];
  const topDebtor = [...customers].sort((a, b) => b.debt - a.debt)[0];
  const lowStock = products.filter((p) => isLowStock(p));
  const highStock = [...products].sort((a, b) => b.stock - a.stock).slice(0, 3);
  const slowMoving = ranked.filter((p) => p.units === 0).slice(0, 5);

  const totalSales = sales.filter((s) => !s.voided).reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = 0;
  const estimatedProfit = totalSales - totalExpenses;

  const paymentMix: Record<string, number> = {};
  sales.filter((s) => !s.voided).forEach((s) => {
    paymentMix[s.paymentMethod] = (paymentMix[s.paymentMethod] ?? 0) + s.total;
  });

  return {
    bestSeller: ranked[0],
    leastSeller: [...ranked].sort((a, b) => a.units - b.units)[0],
    ranked,
    topBuyer,
    topDebtor,
    lowStock,
    highStock,
    slowMoving,
    totalSales,
    estimatedProfit,
    paymentMix
  };
}

/** Percentage change between today's and yesterday's totals for a metric. */
export function dayOverDayChange(sales: SaleRecord[], metric: "revenue" | "units" = "revenue") {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

  const measure = (sale: SaleRecord) =>
    metric === "revenue" ? sale.total : sale.lines.reduce((sum, line) => sum + line.quantity, 0);

  let today = 0;
  let yesterday = 0;
  sales.forEach((sale) => {
    if (sale.voided) return;
    const at = new Date(sale.createdAt).getTime();
    if (at >= startOfToday.getTime()) today += measure(sale);
    else if (at >= startOfYesterday.getTime()) yesterday += measure(sale);
  });

  if (yesterday === 0) return { today, yesterday, percent: today > 0 ? 100 : 0, up: today > 0 };
  const percent = ((today - yesterday) / yesterday) * 100;
  return { today, yesterday, percent, up: percent >= 0 };
}

export function debtAging(debts: Debt[]) {
  const now = Date.now();
  const buckets = { current: 0, days30: 0, days60: 0, days90: 0, overdue: 0 };
  debts.forEach((d) => {
    const age = now - new Date(d.createdAt).getTime();
    const days = Math.floor(age / 86400000);
    if (d.dueDate && new Date(d.dueDate) < new Date()) {
      buckets.overdue += d.outstandingAmount;
    } else if (days <= 30) {
      buckets.current += d.outstandingAmount;
    } else if (days <= 60) {
      buckets.days30 += d.outstandingAmount;
    } else if (days <= 90) {
      buckets.days60 += d.outstandingAmount;
    } else {
      buckets.days90 += d.outstandingAmount;
    }
  });
  return buckets;
}

export function estimatedProfitCalc(sales: SaleRecord[], expenses: Expense[], products: Product[]): number {
  const revenue = sales.filter((s) => !s.voided).reduce((sum, s) => sum + s.total, 0);
  const cogs = sales.filter((s) => !s.voided).reduce((sum, s) => {
    return sum + s.lines.reduce((lineSum, line) => {
      const product = products.find((p) => p.id === line.productId);
      const cost = product?.costPrice ?? 0;
      if (line.mode === "shot" && product?.shotsPerBottle) {
        return lineSum + (cost / product.shotsPerBottle) * line.quantity;
      }
      return lineSum + cost * line.quantity;
    }, 0);
  }, 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  return revenue - cogs - expenseTotal;
}

export function topWaiter(staff: Array<{ id: string; name: string; salesCount: number }>) {
  return [...staff].sort((a, b) => b.salesCount - a.salesCount)[0];
}

export function tablePerformance(tables: Array<{ id: string; name: string; bill: number }>) {
  return [...tables].sort((a, b) => b.bill - a.bill);
}

export function customerRanking(customers: Customer[]) {
  return [...customers].sort((a, b) => b.totalSpent - a.totalSpent);
}

export function stockValuation(products: Product[]): number {
  return products.reduce((sum, p) => sum + p.stock * (p.costPrice ?? p.bottlePrice * 0.6), 0);
}

export function weeklySalesSeries(sales: SaleRecord[]): Array<{ name: string; value: number }> {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const buckets: Array<{ name: string; value: number }> = [];

  for (let i = 6; i >= 0; i -= 1) {
    const dayStart = new Date(today.getTime() - i * 86400000);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const total = sales
      .filter((s) => {
        if (s.voided) return false;
        const created = new Date(s.createdAt);
        return created >= dayStart && created < dayEnd;
      })
      .reduce((sum, s) => sum + s.total, 0);
    buckets.push({ name: days[dayStart.getDay()], value: total });
  }

  return buckets;
}
