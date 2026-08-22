import type { SaleRecord, CartLine, PaymentMethod } from "@/lib/types";
import type { SupabaseClient } from "./base";
import { RepositoryError } from "./base";
import { mapSaleFromDb } from "./mappers";
import { ghanaCedisToPesewas } from "@/lib/domain/money";

export interface CheckoutInput {
  lines: CartLine[];
  paymentMethod: PaymentMethod;
  discount: number;
  tableId?: string;
  customerId?: string;
  cashierId: string;
  note?: string;
  idempotencyKey?: string;
}

export class OrdersRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(limit = 100): Promise<SaleRecord[]> {
    const { data, error } = await this.client
      .from("orders")
      .select(`
        id, table_id, customer_id, opened_by, status,
        subtotal_pesewas, discount_pesewas, total_pesewas,
        created_at, closed_at,
        order_lines(id, product_id, sale_unit, quantity, unit_price_pesewas),
        payments(method, status)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new RepositoryError(error.message, error.code);

    return (data as Record<string, unknown>[]).map((row) => {
      const lines = (row.order_lines as Record<string, unknown>[] ?? []).map((l) => ({
        id: l.id as string,
        productId: l.product_id as string,
        name: "",
        mode: l.sale_unit as "bottle" | "shot",
        unitPrice: (l.unit_price_pesewas as number) / 100,
        quantity: l.quantity as number
      }));
      const payments = row.payments as Record<string, unknown>[] | null;
      const payment = payments?.[0];
      return mapSaleFromDb({
        ...row,
        payment_method: payment?.method ?? "cash",
        payment_status: payment?.status ?? "pending",
        discount_pesewas: row.discount_pesewas ?? 0,
        total_pesewas: row.total_pesewas,
        note: null
      }, lines);
    });
  }

  async checkout(input: CheckoutInput): Promise<SaleRecord> {
    const lineItems = input.lines.map((l) => ({
      product_id: l.productId,
      sale_unit: l.mode,
      quantity: l.quantity,
      unit_price_pesewas: ghanaCedisToPesewas(l.unitPrice)
    }));

    const { data, error } = await this.client.rpc("checkout_order", {
      p_lines: lineItems,
      p_payment_method: input.paymentMethod === "gift" ? "gift_card" : input.paymentMethod,
      p_discount_pesewas: ghanaCedisToPesewas(input.discount),
      p_table_id: input.tableId ?? null,
      p_customer_id: input.customerId ?? null,
      p_cashier_id: input.cashierId,
      p_idempotency_key: input.idempotencyKey ?? crypto.randomUUID()
    });

    if (error) throw new RepositoryError(error.message, error.code);

    const result = data as Record<string, unknown>;
    return {
      id: result.order_id as string,
      total: (result.total_pesewas as number) / 100,
      paymentMethod: input.paymentMethod,
      paymentStatus: "successful",
      createdAt: new Date().toISOString(),
      lines: input.lines,
      tableId: input.tableId,
      customerId: input.customerId,
      cashierId: input.cashierId,
      discount: input.discount,
      note: input.note,
      voided: false
    };
  }

  async voidOrder(orderId: string): Promise<void> {
    const { error } = await this.client.from("orders").update({ status: "voided", closed_at: new Date().toISOString() }).eq("id", orderId);
    if (error) throw new RepositoryError(error.message, error.code);
  }

  async holdOrder(orderId: string): Promise<void> {
    const { error } = await this.client.from("orders").update({ status: "held" }).eq("id", orderId);
    if (error) throw new RepositoryError(error.message, error.code);
  }

  async splitBill(originalOrderId: string, lineIds: string[]): Promise<string> {
    const { data, error } = await this.client.rpc("split_bill", {
      p_original_order_id: originalOrderId,
      p_line_ids: lineIds
    });
    if (error) throw new RepositoryError(error.message, error.code);
    return data as string;
  }
}
