import type { GiftCard } from "@/lib/types";
import type { SupabaseClient } from "./base";
import { safeQuery, RepositoryError } from "./base";
import { mapGiftCardFromDb } from "./mappers";
import { ghanaCedisToPesewas } from "@/lib/domain/money";

export class GiftCardsRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(): Promise<GiftCard[]> {
    const { data, error } = await this.client.from("gift_cards").select("*").order("created_at", { ascending: false });
    if (error) throw new RepositoryError(error.message, error.code);
    return (data as Record<string, unknown>[]).map(mapGiftCardFromDb);
  }

  async create(initialBalance: number, expiryDate?: string, recipientName?: string): Promise<GiftCard> {
    const code = `EMD-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const data = await safeQuery(this.client.from("gift_cards").insert({
      code_hash: code,
      display_suffix: code,
      initial_balance_pesewas: ghanaCedisToPesewas(initialBalance),
      balance_pesewas: ghanaCedisToPesewas(initialBalance),
      status: "active",
      expiry_date: expiryDate ?? null,
      recipient_name: recipientName ?? null
    }).select().single());
    return mapGiftCardFromDb(data as unknown as Record<string, unknown>);
  }

  async redeem(code: string, amount: number, orderId: string, recordedBy: string): Promise<void> {
    const { error } = await this.client.rpc("redeem_gift_card", {
      p_code: code,
      p_amount_pesewas: ghanaCedisToPesewas(amount),
      p_order_id: orderId,
      p_recorded_by: recordedBy
    });
    if (error) throw new RepositoryError(error.message, error.code);
  }

  async getByCode(code: string): Promise<GiftCard | null> {
    const { data, error } = await this.client.from("gift_cards").select("*").eq("display_suffix", code).single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw new RepositoryError(error.message, error.code);
    }
    return data ? mapGiftCardFromDb(data as Record<string, unknown>) : null;
  }
}
