export type ProductCategory = "Beer" | "Spirits" | "Wine" | "Soft Drinks" | "Water" | "Energy Drinks" | "Cigarettes" | "Snacks" | "Juice";
export type SaleMode = "bottle" | "shot";
export type PaymentMethod = "cash" | "momo" | "card" | "gift" | "wallet";
export type PaymentStatus = "pending" | "successful" | "failed" | "reversed";
export type OrderStatus = "open" | "held" | "paid" | "voided";
export type GiftCardStatus = "active" | "redeemed" | "disabled" | "expired";
export type AppRole = "owner" | "manager" | "cashier" | "waiter";
export type StockMovementType =
  | "purchase" | "sale_bottle" | "open_for_shots"
  | "adjustment_in" | "adjustment_out" | "waste";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  bottlePrice: number;
  shotPrice?: number;
  stock: number;
  reorderLevel: number;
  shotsPerBottle?: number;
  remainingShots?: number;
  active: boolean;
  costPrice?: number;
}

export interface CartLine {
  id: string;
  productId: string;
  name: string;
  mode: SaleMode;
  unitPrice: number;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;
  debt: number;
  loyaltyPoints: number;
  walletBalance: number;
  lastPurchaseDate?: string;
  visitCount: number;
}

export interface BarTable {
  id: string;
  name: string;
  occupied: boolean;
  bill: number;
  waiterId?: string;
  orderId?: string;
}

export interface GiftCard {
  id: string;
  code: string;
  balance: number;
  status: GiftCardStatus;
  expiryDate?: string;
  createdAt: string;
}

export interface SaleRecord {
  id: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  lines: CartLine[];
  tableId?: string;
  customerId?: string;
  cashierId?: string;
  discount: number;
  note?: string;
  voided: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  createdAt: string;
  recordedBy?: string;
}

export interface Debt {
  id: string;
  customerId: string;
  customerName: string;
  originalAmount: number;
  outstandingAmount: number;
  orderId?: string;
  dueDate?: string;
  note?: string;
  createdAt: string;
  payments: DebtPayment[];
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  customerId: string;
  amountDelta: number;
  pointsDelta: number;
  reason: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  movementType: StockMovementType;
  bottleDelta: number;
  shotDelta: number;
  reason?: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: AppRole;
  active: boolean;
  phone?: string;
  salesCount: number;
  ordersHandled: number;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  promotionText?: string;
  featured: boolean;
  active: boolean;
  reservedTables?: string[];
}

export interface HeldOrder {
  id: string;
  lines: CartLine[];
  tableId?: string;
  customerId?: string;
  note?: string;
  heldAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  method: PaymentMethod;
  provider?: string;
  amount: number;
  status: PaymentStatus;
  idempotencyKey: string;
  providerReference?: string;
  phoneMasked?: string;
  cardLast4?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessSettings {
  businessName: string;
  currency: string;
  location: string;
  taxRate: number;
  serviceChargeRate: number;
  receiptFooter: string;
  lowStockThreshold: number;
}
