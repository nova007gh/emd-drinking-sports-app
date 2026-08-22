import type { BarTable, Customer, GiftCard, Product, SaleRecord, StaffMember, Match, Expense, Debt } from "./types";

export const productsSeed: Product[] = [
  { id: "p1", name: "Club Beer", category: "Beer", bottlePrice: 18, stock: 32, reorderLevel: 10, active: true, costPrice: 12 },
  { id: "p2", name: "Guinness", category: "Beer", bottlePrice: 20, stock: 24, reorderLevel: 10, active: true, costPrice: 14 },
  { id: "p3", name: "Heineken", category: "Beer", bottlePrice: 22, stock: 20, reorderLevel: 8, active: true, costPrice: 15 },
  { id: "p4", name: "Black & White", category: "Spirits", bottlePrice: 220, shotPrice: 15, stock: 8, reorderLevel: 3, shotsPerBottle: 15, remainingShots: 10, active: true, costPrice: 150 },
  { id: "p5", name: "Johnnie Walker", category: "Spirits", bottlePrice: 250, shotPrice: 18, stock: 5, reorderLevel: 3, shotsPerBottle: 15, remainingShots: 6, active: true, costPrice: 170 },
  { id: "p6", name: "Hennessy VS", category: "Spirits", bottlePrice: 300, shotPrice: 22, stock: 3, reorderLevel: 3, shotsPerBottle: 15, remainingShots: 9, active: true, costPrice: 210 },
  { id: "p7", name: "Red Wine", category: "Wine", bottlePrice: 150, shotPrice: 12, stock: 6, reorderLevel: 4, shotsPerBottle: 12, remainingShots: 8, active: true, costPrice: 90 },
  { id: "p8", name: "Coke", category: "Soft Drinks", bottlePrice: 10, stock: 40, reorderLevel: 12, active: true, costPrice: 5 },
  { id: "p9", name: "Malt", category: "Soft Drinks", bottlePrice: 15, stock: 18, reorderLevel: 8, active: true, costPrice: 8 },
  { id: "p10", name: "Water", category: "Water", bottlePrice: 5, stock: 45, reorderLevel: 15, active: true, costPrice: 2 }
];

export const customersSeed: Customer[] = [
  { id: "c1", name: "Kwame Asare", phone: "0240000001", totalSpent: 960, debt: 560, loyaltyPoints: 96, walletBalance: 50, visitCount: 24, lastPurchaseDate: new Date(Date.now() - 86400000).toISOString() },
  { id: "c2", name: "Nana Yaw", phone: "0240000002", totalSpent: 735, debt: 420, loyaltyPoints: 73, walletBalance: 0, visitCount: 18, lastPurchaseDate: new Date(Date.now() - 172800000).toISOString() },
  { id: "c3", name: "Akosua Darko", phone: "0240000003", totalSpent: 550, debt: 60, loyaltyPoints: 55, walletBalance: 120, visitCount: 12, lastPurchaseDate: new Date(Date.now() - 259200000).toISOString() },
  { id: "c4", name: "Kofi Mensah", phone: "0240000004", totalSpent: 430, debt: 310, loyaltyPoints: 43, walletBalance: 0, visitCount: 9, lastPurchaseDate: new Date(Date.now() - 432000000).toISOString() }
];

export const tablesSeed: BarTable[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i + 1}`,
  name: `Table ${i + 1}`,
  occupied: [0, 2, 4, 5, 8].includes(i),
  bill: [120, 0, 80, 0, 132, 60, 0, 0, 200, 0, 0, 0][i]
}));

export const giftCardsSeed: GiftCard[] = [
  { id: "g1", code: "EMD-9XK2-44LM", balance: 100, status: "active", createdAt: new Date().toISOString(), expiryDate: new Date(Date.now() + 7776000000).toISOString() },
  { id: "g2", code: "EMD-GOLD-250", balance: 250, status: "active", createdAt: new Date().toISOString(), expiryDate: new Date(Date.now() + 7776000000).toISOString() }
];

export const salesSeed: SaleRecord[] = [
  { id: "s1", total: 245, paymentMethod: "momo", paymentStatus: "successful", createdAt: new Date().toISOString(), lines: [
    { id: "sl1", productId: "p1", name: "Club Beer", mode: "bottle", unitPrice: 18, quantity: 5 },
    { id: "sl2", productId: "p8", name: "Coke", mode: "bottle", unitPrice: 10, quantity: 3 },
    { id: "sl3", productId: "p4", name: "Black & White", mode: "shot", unitPrice: 15, quantity: 8 }
  ], discount: 0, voided: false, customerId: "c1", tableId: "t1", cashierId: "demo-owner" },
  { id: "s2", total: 130, paymentMethod: "cash", paymentStatus: "successful", createdAt: new Date(Date.now() - 3600000).toISOString(), lines: [
    { id: "sl4", productId: "p2", name: "Guinness", mode: "bottle", unitPrice: 20, quantity: 4 },
    { id: "sl5", productId: "p10", name: "Water", mode: "bottle", unitPrice: 5, quantity: 2 },
    { id: "sl6", productId: "p9", name: "Malt", mode: "bottle", unitPrice: 15, quantity: 2 }
  ], discount: 0, voided: false, customerId: "c2", tableId: "t3", cashierId: "demo-cashier" },
  { id: "s3", total: 330, paymentMethod: "card", paymentStatus: "successful", createdAt: new Date(Date.now() - 7200000).toISOString(), lines: [
    { id: "sl7", productId: "p5", name: "Johnnie Walker", mode: "shot", unitPrice: 18, quantity: 5 },
    { id: "sl8", productId: "p3", name: "Heineken", mode: "bottle", unitPrice: 22, quantity: 6 },
    { id: "sl9", productId: "p7", name: "Red Wine", mode: "shot", unitPrice: 12, quantity: 4 }
  ], discount: 0, voided: false, customerId: "c3", tableId: "t5", cashierId: "demo-owner" },
  { id: "s4", total: 180, paymentMethod: "cash", paymentStatus: "successful", createdAt: new Date(Date.now() - 86400000).toISOString(), lines: [
    { id: "sl10", productId: "p1", name: "Club Beer", mode: "bottle", unitPrice: 18, quantity: 6 },
    { id: "sl11", productId: "p8", name: "Coke", mode: "bottle", unitPrice: 10, quantity: 2 },
    { id: "sl12", productId: "p10", name: "Water", mode: "bottle", unitPrice: 5, quantity: 4 }
  ], discount: 0, voided: false, customerId: "c1", tableId: "t2", cashierId: "demo-cashier" },
  { id: "s5", total: 420, paymentMethod: "momo", paymentStatus: "successful", createdAt: new Date(Date.now() - 172800000).toISOString(), lines: [
    { id: "sl13", productId: "p6", name: "Hennessy VS", mode: "shot", unitPrice: 22, quantity: 6 },
    { id: "sl14", productId: "p4", name: "Black & White", mode: "shot", unitPrice: 15, quantity: 6 },
    { id: "sl15", productId: "p3", name: "Heineken", mode: "bottle", unitPrice: 22, quantity: 3 }
  ], discount: 0, voided: false, customerId: "c2", tableId: "t6", cashierId: "demo-owner" },
  { id: "s6", total: 95, paymentMethod: "cash", paymentStatus: "successful", createdAt: new Date(Date.now() - 259200000).toISOString(), lines: [
    { id: "sl16", productId: "p2", name: "Guinness", mode: "bottle", unitPrice: 20, quantity: 3 },
    { id: "sl17", productId: "p9", name: "Malt", mode: "bottle", unitPrice: 15, quantity: 2 },
    { id: "sl18", productId: "p10", name: "Water", mode: "bottle", unitPrice: 5, quantity: 1 }
  ], discount: 0, voided: false, customerId: "c4", tableId: "t9", cashierId: "demo-waiter" },
  { id: "s7", total: 560, paymentMethod: "card", paymentStatus: "successful", createdAt: new Date(Date.now() - 345600000).toISOString(), lines: [
    { id: "sl19", productId: "p4", name: "Black & White", mode: "bottle", unitPrice: 220, quantity: 1 },
    { id: "sl20", productId: "p7", name: "Red Wine", mode: "shot", unitPrice: 12, quantity: 10 },
    { id: "sl21", productId: "p1", name: "Club Beer", mode: "bottle", unitPrice: 18, quantity: 5 },
    { id: "sl22", productId: "p8", name: "Coke", mode: "bottle", unitPrice: 10, quantity: 4 }
  ], discount: 0, voided: false, customerId: "c3", tableId: "t5", cashierId: "demo-owner" },
  { id: "s8", total: 210, paymentMethod: "momo", paymentStatus: "successful", createdAt: new Date(Date.now() - 432000000).toISOString(), lines: [
    { id: "sl23", productId: "p5", name: "Johnnie Walker", mode: "shot", unitPrice: 18, quantity: 5 },
    { id: "sl24", productId: "p2", name: "Guinness", mode: "bottle", unitPrice: 20, quantity: 6 }
  ], discount: 0, voided: false, customerId: "c1", tableId: "t1", cashierId: "demo-manager" },
  { id: "s9", total: 150, paymentMethod: "cash", paymentStatus: "successful", createdAt: new Date(Date.now() - 518400000).toISOString(), lines: [
    { id: "sl25", productId: "p3", name: "Heineken", mode: "bottle", unitPrice: 22, quantity: 4 },
    { id: "sl26", productId: "p10", name: "Water", mode: "bottle", unitPrice: 5, quantity: 2 },
    { id: "sl27", productId: "p9", name: "Malt", mode: "bottle", unitPrice: 15, quantity: 2 }
  ], discount: 0, voided: false, customerId: "c4", tableId: "t3", cashierId: "demo-cashier" },
  { id: "s10", total: 280, paymentMethod: "momo", paymentStatus: "successful", createdAt: new Date(Date.now() - 604800000).toISOString(), lines: [
    { id: "sl28", productId: "p6", name: "Hennessy VS", mode: "shot", unitPrice: 22, quantity: 4 },
    { id: "sl29", productId: "p1", name: "Club Beer", mode: "bottle", unitPrice: 18, quantity: 4 },
    { id: "sl30", productId: "p8", name: "Coke", mode: "bottle", unitPrice: 10, quantity: 5 },
    { id: "sl31", productId: "p10", name: "Water", mode: "bottle", unitPrice: 5, quantity: 4 }
  ], discount: 0, voided: false, customerId: "c2", tableId: "t6", cashierId: "demo-owner" }
];

export const staffSeed: StaffMember[] = [
  { id: "u1", name: "Emmanuel", role: "owner", active: true, phone: "0240000000", salesCount: 142, ordersHandled: 38 },
  { id: "u2", name: "Yaw", role: "manager", active: true, phone: "0240000010", salesCount: 98, ordersHandled: 27 },
  { id: "u3", name: "Ama", role: "cashier", active: true, phone: "0240000020", salesCount: 215, ordersHandled: 52 },
  { id: "u4", name: "Kojo", role: "waiter", active: true, phone: "0240000030", salesCount: 67, ordersHandled: 41 }
];

export const matchesSeed: Match[] = [
  { id: "m1", homeTeam: "Manchester United", awayTeam: "Arsenal", startsAt: new Date(Date.now() + 28800000).toISOString(), promotionText: "Big match tonight", featured: true, active: true },
  { id: "m2", homeTeam: "Chelsea", awayTeam: "Liverpool", startsAt: new Date(Date.now() + 86400000).toISOString(), active: true, featured: false },
  { id: "m3", homeTeam: "Barcelona", awayTeam: "Real Madrid", startsAt: new Date(Date.now() + 172800000).toISOString(), active: true, featured: false },
  { id: "m4", homeTeam: "PSG", awayTeam: "Marseille", startsAt: new Date(Date.now() + 259200000).toISOString(), active: true, featured: false }
];

export const debtsSeed: Debt[] = [
  { id: "d1", customerId: "c1", customerName: "Kwame Asare", originalAmount: 560, outstandingAmount: 560, createdAt: new Date(Date.now() - 604800000).toISOString(), dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10), payments: [] },
  { id: "d2", customerId: "c2", customerName: "Nana Yaw", originalAmount: 420, outstandingAmount: 420, createdAt: new Date(Date.now() - 432000000).toISOString(), dueDate: new Date(Date.now() + 432000000).toISOString().slice(0, 10), payments: [] },
  { id: "d3", customerId: "c4", customerName: "Kofi Mensah", originalAmount: 310, outstandingAmount: 310, createdAt: new Date(Date.now() - 259200000).toISOString(), dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), payments: [] }
];

export const expensesSeed: Expense[] = [
  { id: "e1", title: "Ice", amount: 50, category: "supplies", createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "e2", title: "Electricity", amount: 200, category: "utilities", createdAt: new Date(Date.now() - 86400000).toISOString() }
];
