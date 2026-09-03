export type ProductCategory = "Beer" | "Spirits" | "Wine" | "Soft Drinks" | "Water" | "Energy Drinks" | "Cigarettes" | "Snacks" | "Juice";
export type SaleMode = "bottle" | "shot";
export type PaymentMethod = "cash" | "momo" | "card" | "gift" | "wallet";
export type PaymentStatus = "pending" | "successful" | "failed" | "reversed";
export type OrderStatus = "open" | "held" | "paid" | "voided";
export type GiftCardStatus = "active" | "redeemed" | "disabled" | "expired";
export type AppRole = "owner" | "manager" | "cashier" | "waiter";
export type StockMovementType =
  | "purchase" | "sale_bottle" | "open_for_shots"
  | "adjustment_in" | "adjustment_out" | "waste" | "redemption";

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
  imageUrl?: string;
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
  avatarUrl?: string;
}

export interface SeatTab {
  id: string;
  name: string;
  bill: number;
  paid: boolean;
  items: CartLine[];
}

export interface BarTable {
  id: string;
  name: string;
  occupied: boolean;
  bill: number;
  waiterId?: string;
  orderId?: string;
  seats: SeatTab[];
  creditLimit?: number;
  lastClosedAt?: string;
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
  avatarUrl?: string;
}

export type EventCategory = "sports" | "music" | "nightclub" | "games" | "other";

export interface BarEvent {
  id: string;
  title: string;
  category: EventCategory;
  /** For sports: home team. For other events: primary artist/team/act */
  homeTeam?: string;
  /** For sports: away team. For other events: supporting act or opponent */
  awayTeam?: string;
  startsAt: string;
  endsAt?: string;
  promotionText?: string;
  featured: boolean;
  active: boolean;
  reservedTables?: string[];
  /** Cover charge in pesewas (0 = free) */
  coverChargePesewas?: number;
  /** DJ, performer, or host name */
  hostName?: string;
  /** Max capacity for attendees (excluding table reservations) */
  maxCapacity?: number;
  /** Count of attendees (tracked via bookings) */
  attendeeCount?: number;
}

/** @deprecated Use BarEvent instead — kept for backwards compatibility */
export type Match = BarEvent;

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

export interface CustomerOrder {
  id: string;
  customerId: string;
  tableId?: string;
  lines: CartLine[];
  status: "pending" | "preparing" | "served" | "paid";
  createdAt: string;
  note?: string;
}

export interface WaiterCall {
  id: string;
  tableId: string;
  customerId?: string;
  waiterId?: string;
  status: "pending" | "accepted" | "arrived";
  message?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  tableId: string;
  customerId?: string;
  waiterId?: string;
  sender: "customer" | "waiter";
  text: string;
  createdAt: string;
}

export interface EventBooking {
  id: string;
  matchId: string; // kept for backwards compat — same as eventId
  eventId?: string;
  customerId: string;
  customerName: string;
  tableId?: string;
  type: "attend" | "reserve";
  createdAt: string;
}

