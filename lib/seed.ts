import type { BarTable, Customer, GiftCard, Product, SaleRecord, StaffMember, BarEvent, Expense, Debt } from "./types";

export const productsSeed: Product[] = [
  // Beer
  { id: "p1", name: "Club Beer", category: "Beer", bottlePrice: 18, stock: 32, reorderLevel: 10, active: true, costPrice: 12, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Club_Beer.jpg/200px-Club_Beer.jpg" },
  { id: "p2", name: "Guinness", category: "Beer", bottlePrice: 20, stock: 24, reorderLevel: 10, active: true, costPrice: 14, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Guinness_Extra_Stout.JPG/200px-Guinness_Extra_Stout.JPG" },
  { id: "p3", name: "Heineken", category: "Beer", bottlePrice: 22, stock: 20, reorderLevel: 8, active: true, costPrice: 15, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Heineken_Bottle.JPG/200px-Heineken_Bottle.JPG" },
  { id: "p11", name: "Star Beer", category: "Beer", bottlePrice: 16, stock: 28, reorderLevel: 10, active: true, costPrice: 10 },
  { id: "p12", name: "Budweiser", category: "Beer", bottlePrice: 25, stock: 15, reorderLevel: 6, active: true, costPrice: 18, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Budweiser_bottle_close-up.jpg/200px-Budweiser_bottle_close-up.jpg" },
  { id: "p13", name: "Gulder", category: "Beer", bottlePrice: 17, stock: 22, reorderLevel: 8, active: true, costPrice: 11 },
  // Spirits
  { id: "p4", name: "Black & White", category: "Spirits", bottlePrice: 220, shotPrice: 15, stock: 8, reorderLevel: 3, shotsPerBottle: 15, remainingShots: 10, active: true, costPrice: 150, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Black_%26_White_%28whisky%29_bottle_04.jpg/200px-Black_%26_White_%28whisky%29_bottle_04.jpg" },
  { id: "p5", name: "Johnnie Walker", category: "Spirits", bottlePrice: 250, shotPrice: 18, stock: 5, reorderLevel: 3, shotsPerBottle: 15, remainingShots: 6, active: true, costPrice: 170, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Johnnie_Walker_Black_Label.jpg/200px-Johnnie_Walker_Black_Label.jpg" },
  { id: "p6", name: "Hennessy VS", category: "Spirits", bottlePrice: 300, shotPrice: 22, stock: 3, reorderLevel: 3, shotsPerBottle: 15, remainingShots: 9, active: true, costPrice: 210, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Hennessy_cognac_bottle_with_drinking_glass.JPG/200px-Hennessy_cognac_bottle_with_drinking_glass.JPG" },
  { id: "p14", name: "Adebayo", category: "Spirits", bottlePrice: 180, shotPrice: 12, stock: 6, reorderLevel: 3, shotsPerBottle: 15, remainingShots: 11, active: true, costPrice: 120 },
  { id: "p15", name: "Smirnoff Vodka", category: "Spirits", bottlePrice: 200, shotPrice: 14, stock: 7, reorderLevel: 3, shotsPerBottle: 15, remainingShots: 8, active: true, costPrice: 140, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Smirnoff_Vodka_375ml_bottle_%28standing_up%29.jpg/200px-Smirnoff_Vodka_375ml_bottle_%28standing_up%29.jpg" },
  { id: "p16", name: "Jack Daniel's", category: "Spirits", bottlePrice: 280, shotPrice: 20, stock: 4, reorderLevel: 3, shotsPerBottle: 15, remainingShots: 5, active: true, costPrice: 190, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Jack_Daniels_bottle.jpg/200px-Jack_Daniels_bottle.jpg" },
  // Wine
  { id: "p7", name: "Red Wine", category: "Wine", bottlePrice: 150, shotPrice: 12, stock: 6, reorderLevel: 4, shotsPerBottle: 12, remainingShots: 8, active: true, costPrice: 90, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/C%C3%B4tes_de_Provence_red_wine.jpg/200px-C%C3%B4tes_de_Provence_red_wine.jpg" },
  { id: "p17", name: "White Wine", category: "Wine", bottlePrice: 140, shotPrice: 11, stock: 5, reorderLevel: 4, shotsPerBottle: 12, remainingShots: 10, active: true, costPrice: 85, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/19-07-2017_Portuguese_white_wine%2C_Dao_Sul_Xadrez.JPG/200px-19-07-2017_Portuguese_white_wine%2C_Dao_Sul_Xadrez.JPG" },
  { id: "p18", name: "Rose Wine", category: "Wine", bottlePrice: 130, stock: 4, reorderLevel: 3, active: true, costPrice: 80, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/18-07-2017_Portuguese_ros%C3%A9_wine%2C_Mateus.JPG/200px-18-07-2017_Portuguese_ros%C3%A9_wine%2C_Mateus.JPG" },
  // Soft Drinks
  { id: "p8", name: "Coke", category: "Soft Drinks", bottlePrice: 10, stock: 40, reorderLevel: 12, active: true, costPrice: 5, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Coca-Cola_bottles.jpg/200px-Coca-Cola_bottles.jpg" },
  { id: "p9", name: "Malt", category: "Soft Drinks", bottlePrice: 15, stock: 18, reorderLevel: 8, active: true, costPrice: 8 },
  { id: "p19", name: "Fanta", category: "Soft Drinks", bottlePrice: 10, stock: 30, reorderLevel: 10, active: true, costPrice: 5, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Fanta_1500ml.jpg/200px-Fanta_1500ml.jpg" },
  { id: "p20", name: "Sprite", category: "Soft Drinks", bottlePrice: 10, stock: 25, reorderLevel: 10, active: true, costPrice: 5, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Chinese_Sprite_1.25L.jpg/200px-Chinese_Sprite_1.25L.jpg" },
  // Water
  { id: "p10", name: "Water", category: "Water", bottlePrice: 5, stock: 45, reorderLevel: 15, active: true, costPrice: 2, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/PET_Bottle_Water.jpg/200px-PET_Bottle_Water.jpg" },
  { id: "p21", name: "Voltic Water 1.5L", category: "Water", bottlePrice: 12, stock: 20, reorderLevel: 8, active: true, costPrice: 6 },
  // Energy Drinks
  { id: "p22", name: "Red Bull", category: "Energy Drinks", bottlePrice: 25, stock: 16, reorderLevel: 8, active: true, costPrice: 15, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/8.4_floz_can_of_Red_Bull_Energy_Drink.jpg/200px-8.4_floz_can_of_Red_Bull_Energy_Drink.jpg" },
  { id: "p23", name: "Storm Energy", category: "Energy Drinks", bottlePrice: 18, stock: 14, reorderLevel: 6, active: true, costPrice: 10 },
  { id: "p24", name: "Predator", category: "Energy Drinks", bottlePrice: 20, stock: 12, reorderLevel: 6, active: true, costPrice: 12 },
  // Cigarettes
  { id: "p25", name: "Marlboro Red", category: "Cigarettes", bottlePrice: 35, stock: 20, reorderLevel: 8, active: true, costPrice: 22, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Marlboro_Reds.JPG/200px-Marlboro_Reds.JPG" },
  { id: "p26", name: "Rothmans", category: "Cigarettes", bottlePrice: 28, stock: 18, reorderLevel: 8, active: true, costPrice: 18, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Rothmans_cigarettes_James_Bond_gadget.JPG/200px-Rothmans_cigarettes_James_Bond_gadget.JPG" },
  { id: "p27", name: "Benson & Hedges", category: "Cigarettes", bottlePrice: 32, stock: 15, reorderLevel: 6, active: true, costPrice: 20, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Benson_%26_Hedges_Special_Filter_cigarette.jpg/200px-Benson_%26_Hedges_Special_Filter_cigarette.jpg" },
  { id: "p28", name: "London Menthol", category: "Cigarettes", bottlePrice: 30, stock: 10, reorderLevel: 6, active: true, costPrice: 19 },
  // Snacks
  { id: "p29", name: "Plantain Chips", category: "Snacks", bottlePrice: 8, stock: 30, reorderLevel: 10, active: true, costPrice: 4, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Plantain_chips.jpg/200px-Plantain_chips.jpg" },
  { id: "p30", name: "Peanuts", category: "Snacks", bottlePrice: 6, stock: 25, reorderLevel: 10, active: true, costPrice: 3, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Peanuts_%281%29.jpg/200px-Peanuts_%281%29.jpg" },
  { id: "p31", name: "Sausage Roll", category: "Snacks", bottlePrice: 12, stock: 15, reorderLevel: 6, active: true, costPrice: 7 },
  { id: "p32", name: "Meat Pie", category: "Snacks", bottlePrice: 15, stock: 10, reorderLevel: 5, active: true, costPrice: 8, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Steak_and_onion_pie.jpg/200px-Steak_and_onion_pie.jpg" },
  // Juice
  { id: "p33", name: "Pineapple Juice", category: "Juice", bottlePrice: 14, stock: 16, reorderLevel: 6, active: true, costPrice: 8, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Pineapple_Juice.jpg/200px-Pineapple_Juice.jpg" },
  { id: "p34", name: "Orange Juice", category: "Juice", bottlePrice: 14, stock: 14, reorderLevel: 6, active: true, costPrice: 8, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Orange_juice_1_edit1.jpg/200px-Orange_juice_1_edit1.jpg" },
  { id: "p35", name: "Mango Juice", category: "Juice", bottlePrice: 16, stock: 12, reorderLevel: 6, active: true, costPrice: 9, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Mango_Juice.jpg/200px-Mango_Juice.jpg" }
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
  bill: [120, 0, 80, 0, 132, 60, 0, 0, 200, 0, 0, 0][i],
  seats: [],
  creditLimit: 200
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

export const matchesSeed: BarEvent[] = [
  // Sports
  { id: "m1", title: "Manchester United vs Arsenal", category: "sports", homeTeam: "Manchester United", awayTeam: "Arsenal", startsAt: new Date(Date.now() + 28800000).toISOString(), promotionText: "Big match tonight — live on the big screen", featured: true, active: true, reservedTables: [] },
  { id: "m2", title: "Chelsea vs Liverpool", category: "sports", homeTeam: "Chelsea", awayTeam: "Liverpool", startsAt: new Date(Date.now() + 86400000).toISOString(), active: true, featured: false, reservedTables: [] },
  { id: "m3", title: "Barcelona vs Real Madrid", category: "sports", homeTeam: "Barcelona", awayTeam: "Real Madrid", startsAt: new Date(Date.now() + 172800000).toISOString(), active: true, featured: false, reservedTables: [] },
  // Music
  { id: "m5", title: "Live Afrobeats Night", category: "music", hostName: "DJ Blacko", startsAt: new Date(Date.now() + 432000000).toISOString(), endsAt: new Date(Date.now() + 433800000).toISOString(), promotionText: "Live performance featuring top Afrobeats hits", active: true, featured: false, reservedTables: [], coverChargePesewas: 5000, maxCapacity: 80 },
  { id: "m6", title: "Highlife Friday", category: "music", hostName: "The Amponsah Band", startsAt: new Date(Date.now() + 604800000).toISOString(), endsAt: new Date(Date.now() + 606600000).toISOString(), promotionText: "Classic highlife tunes all night", active: true, featured: false, reservedTables: [], coverChargePesewas: 3000, maxCapacity: 60 },
  // Nightclub
  { id: "m7", title: "Saturday Night Party", category: "nightclub", hostName: "DJ Spinall", startsAt: new Date(Date.now() + 259200000).toISOString(), endsAt: new Date(Date.now() + 262800000).toISOString(), promotionText: "The hottest party in town — bottle service available", active: true, featured: false, reservedTables: [], coverChargePesewas: 10000, maxCapacity: 120 },
  // Games
  { id: "m8", title: "FIFA Tournament Night", category: "games", hostName: "EMD Gaming", startsAt: new Date(Date.now() + 345600000).toISOString(), endsAt: new Date(Date.now() + 347400000).toISOString(), promotionText: "Sign up for the FIFA tournament — prizes for winners", active: true, featured: false, reservedTables: [], coverChargePesewas: 2000, maxCapacity: 32 },
  // Other
  { id: "m9", title: "Karaoke Wednesday", category: "other", hostName: "MC Kwame", startsAt: new Date(Date.now() + 518400000).toISOString(), endsAt: new Date(Date.now() + 520200000).toISOString(), promotionText: "Sing your heart out — drinks specials all night", active: true, featured: false, reservedTables: [], coverChargePesewas: 0, maxCapacity: 50 },
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
