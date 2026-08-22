import type { Product, Customer, BarTable, SaleRecord, CartLine, PaymentMethod, PaymentStatus, ProductCategory, GiftCard, Debt, DebtPayment, Expense, StaffMember, Match, StockMovement, StockMovementType } from "@/lib/types";
import { pesewasToGhanaCedis, ghanaCedisToPesewas } from "@/lib/domain/money";

type SupabaseRow = Record<string, unknown>;

const categoryMap: Record<string, ProductCategory> = {
  beer: "Beer", spirits: "Spirits", wine: "Wine", soft_drinks: "Soft Drinks", water: "Water",
  energy_drinks: "Energy Drinks", cigarettes: "Cigarettes", snacks: "Snacks", juice: "Juice",
  other: "Soft Drinks"
};

const categoryToDb: Record<ProductCategory, string> = {
  Beer: "beer", Spirits: "spirits", Wine: "wine", "Soft Drinks": "soft_drinks", Water: "water",
  "Energy Drinks": "energy_drinks", Cigarettes: "cigarettes", Snacks: "snacks", Juice: "juice"
};

const paymentMethodMap: Record<string, PaymentMethod> = {
  cash: "cash", momo: "momo", card: "card", gift_card: "gift", wallet: "wallet"
};

const paymentMethodToDb: Record<PaymentMethod, string> = {
  cash: "cash", momo: "momo", card: "card", gift: "gift_card", wallet: "wallet"
};

const paymentStatusMap: Record<string, PaymentStatus> = {
  pending: "pending", successful: "successful", failed: "failed", reversed: "reversed"
};

const stockMovementTypeMap: Record<string, StockMovementType> = {
  purchase: "purchase", sale_bottle: "sale_bottle", open_for_shots: "open_for_shots",
  adjustment_in: "adjustment_in", adjustment_out: "adjustment_out", waste: "waste"
};

export function mapProductFromDb(row: SupabaseRow): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    category: categoryMap[row.category as string] ?? "Soft Drinks",
    bottlePrice: pesewasToGhanaCedis(row.bottle_price_pesewas as number),
    shotPrice: row.shot_price_pesewas != null ? pesewasToGhanaCedis(row.shot_price_pesewas as number) : undefined,
    stock: row.sealed_bottle_stock as number,
    shotsPerBottle: row.shots_per_bottle as number | undefined,
    remainingShots: row.open_bottle_shots_remaining as number,
    reorderLevel: row.reorder_level as number,
    active: row.active as boolean,
    costPrice: row.cost_price_pesewas != null ? pesewasToGhanaCedis(row.cost_price_pesewas as number) : undefined
  };
}

export function mapProductToDb(product: Omit<Product, "id" | "active">): SupabaseRow {
  return {
    name: product.name,
    category: categoryToDb[product.category],
    bottle_price_pesewas: ghanaCedisToPesewas(product.bottlePrice),
    shot_price_pesewas: product.shotPrice ? ghanaCedisToPesewas(product.shotPrice) : null,
    sealed_bottle_stock: product.stock,
    shots_per_bottle: product.shotsPerBottle ?? null,
    open_bottle_shots_remaining: product.remainingShots ?? 0,
    reorder_level: product.reorderLevel,
    active: true
  };
}

export function mapCustomerFromDb(row: SupabaseRow): Customer {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: (row.phone as string) ?? "",
    totalSpent: row.total_spent_pesewas ? pesewasToGhanaCedis(row.total_spent_pesewas as number) : 0,
    debt: row.debt_pesewas ? pesewasToGhanaCedis(row.debt_pesewas as number) : 0,
    loyaltyPoints: (row.loyalty_points as number) ?? 0,
    walletBalance: row.wallet_balance_pesewas ? pesewasToGhanaCedis(row.wallet_balance_pesewas as number) : 0,
    visitCount: (row.visit_count as number) ?? 0,
    lastPurchaseDate: row.last_purchase_date as string | undefined
  };
}

export function mapCustomerToDb(customer: { name: string; phone: string }): SupabaseRow {
  return { name: customer.name, phone: customer.phone };
}

export function mapTableFromDb(row: SupabaseRow): BarTable {
  return {
    id: row.id as string,
    name: (row.label as string) ?? "",
    occupied: (row.occupied as boolean) ?? false,
    bill: row.bill_pesewas ? pesewasToGhanaCedis(row.bill_pesewas as number) : 0,
    waiterId: row.waiter_id as string | undefined,
    orderId: row.order_id as string | undefined
  };
}

export function mapSaleFromDb(row: SupabaseRow, lines: CartLine[]): SaleRecord {
  return {
    id: row.id as string,
    total: pesewasToGhanaCedis(row.total_pesewas as number),
    paymentMethod: paymentMethodMap[row.payment_method as string] ?? "cash",
    paymentStatus: paymentStatusMap[row.payment_status as string] ?? "pending",
    createdAt: row.created_at as string,
    lines,
    tableId: row.table_id as string | undefined,
    customerId: row.customer_id as string | undefined,
    cashierId: row.opened_by as string | undefined,
    discount: pesewasToGhanaCedis(row.discount_pesewas as number),
    note: row.note as string | undefined,
    voided: (row.status as string) === "voided"
  };
}

export function mapGiftCardFromDb(row: SupabaseRow): GiftCard {
  return {
    id: row.id as string,
    code: (row.display_suffix as string) ?? "",
    balance: pesewasToGhanaCedis(row.balance_pesewas as number),
    status: (row.status as string) as GiftCard["status"],
    expiryDate: row.expiry_date as string | undefined,
    createdAt: row.created_at as string
  };
}

export function mapDebtFromDb(row: SupabaseRow, payments: DebtPayment[]): Debt {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    customerName: (row.customer_name as string) ?? "",
    originalAmount: pesewasToGhanaCedis(row.original_amount_pesewas as number),
    outstandingAmount: pesewasToGhanaCedis(row.outstanding_amount_pesewas as number),
    orderId: row.order_id as string | undefined,
    dueDate: row.due_date as string | undefined,
    note: row.note as string | undefined,
    createdAt: row.created_at as string,
    payments
  };
}

export function mapExpenseFromDb(row: SupabaseRow): Expense {
  return {
    id: row.id as string,
    title: row.title as string,
    amount: pesewasToGhanaCedis(row.amount_pesewas as number),
    category: (row.category as string) ?? "other",
    createdAt: row.created_at as string,
    recordedBy: row.recorded_by as string | undefined
  };
}

export function mapStaffFromDb(row: SupabaseRow): StaffMember {
  return {
    id: row.id as string,
    name: (row.full_name as string) ?? "",
    role: (row.role as string) as StaffMember["role"],
    active: (row.active as boolean) ?? true,
    phone: row.phone as string | undefined,
    salesCount: (row.sales_count as number) ?? 0,
    ordersHandled: (row.orders_handled as number) ?? 0
  };
}

export function mapMatchFromDb(row: SupabaseRow): Match {
  return {
    id: row.id as string,
    homeTeam: row.home_team as string,
    awayTeam: row.away_team as string,
    startsAt: row.starts_at as string,
    promotionText: row.promotion_text as string | undefined,
    featured: (row.featured as boolean) ?? false,
    active: (row.active as boolean) ?? true
  };
}

export function mapStockMovementFromDb(row: SupabaseRow): StockMovement {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    productName: (row.product_name as string) ?? "",
    movementType: stockMovementTypeMap[row.movement_type as string] ?? "adjustment_in",
    bottleDelta: (row.bottle_delta as number) ?? 0,
    shotDelta: (row.shot_delta as number) ?? 0,
    reason: row.reason as string | undefined,
    createdAt: row.created_at as string
  };
}

export { categoryToDb, paymentMethodToDb };
