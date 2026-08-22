import type { PaymentRecord, PaymentStatus } from "@/lib/types";
import type { SupabaseClient } from "./base";
import { safeQuery, RepositoryError } from "./base";
import { pesewasToGhanaCedis } from "@/lib/domain/money";

export class PaymentsRepository {
  constructor(private client: SupabaseClient) {}

  async getByOrder(orderId: string): Promise<PaymentRecord[]> {
    const { data, error } = await this.client.from("payments").select("*").eq("order_id", orderId).order("created_at", { ascending: false });
    if (error) throw new RepositoryError(error.message, error.code);
    return (data as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      orderId: row.order_id as string,
      method: row.method as PaymentRecord["method"],
      provider: row.provider as string | undefined,
      amount: pesewasToGhanaCedis(row.amount_pesewas as number),
      status: row.status as PaymentStatus,
      idempotencyKey: row.idempotency_key as string,
      providerReference: row.provider_reference as string | undefined,
      phoneMasked: row.phone_masked as string | undefined,
      cardLast4: row.card_last4 as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    }));
  }

  async updateStatus(paymentId: string, status: PaymentStatus): Promise<void> {
    const { error } = await this.client.from("payments").update({ status, updated_at: new Date().toISOString() }).eq("id", paymentId);
    if (error) throw new RepositoryError(error.message, error.code);
  }

  async create(input: {
    orderId: string;
    method: PaymentRecord["method"];
    amount: number;
    provider?: string;
    idempotencyKey?: string;
    providerReference?: string;
    phoneMasked?: string;
    cardLast4?: string;
  }): Promise<PaymentRecord> {
    const data = await safeQuery(this.client.from("payments").insert({
      order_id: input.orderId,
      method: input.method === "gift" ? "gift_card" : input.method,
      amount_pesewas: Math.round(input.amount * 100),
      provider: input.provider ?? null,
      idempotency_key: input.idempotencyKey ?? crypto.randomUUID(),
      provider_reference: input.providerReference ?? null,
      phone_masked: input.phoneMasked ?? null,
      card_last4: input.cardLast4 ?? null,
      status: "pending"
    }).select().single());
    const row = data as unknown as Record<string, unknown>;
    return {
      id: row.id as string,
      orderId: row.order_id as string,
      method: row.method as PaymentRecord["method"],
      provider: row.provider as string | undefined,
      amount: pesewasToGhanaCedis(row.amount_pesewas as number),
      status: row.status as PaymentStatus,
      idempotencyKey: row.idempotency_key as string,
      providerReference: row.provider_reference as string | undefined,
      phoneMasked: row.phone_masked as string | undefined,
      cardLast4: row.card_last4 as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }
}
