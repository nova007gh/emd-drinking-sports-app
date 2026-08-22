import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/repositories/base";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kind, id, payload } = body;

    if (!kind || !id) {
      return NextResponse.json({ error: "Missing required fields: kind, id" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, id, message: "Demo mode — operation acknowledged" });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    switch (kind) {
      case "cash_sale": {
        const { lines, paymentMethod, discount, tableId, customerId } = payload;
        const lineItems = lines.map((l: { productId: string; mode: string; unitPrice: number; quantity: number }) => ({
          product_id: l.productId,
          sale_unit: l.mode,
          quantity: l.quantity,
          unit_price_pesewas: Math.round(l.unitPrice * 100)
        }));

        const { error } = await supabase.rpc("checkout_order", {
          p_lines: lineItems,
          p_payment_method: paymentMethod === "gift" ? "gift_card" : paymentMethod,
          p_discount_pesewas: Math.round((discount ?? 0) * 100),
          p_table_id: tableId ?? null,
          p_customer_id: customerId ?? null,
          p_cashier_id: user.id,
          p_idempotency_key: id
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, id, message: "Checkout synced" });
      }

      case "customer_update": {
        const { customerId, name, phone } = payload;
        const { error } = await supabase
          .from("customers")
          .update({ name, phone })
          .eq("id", customerId);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, id, message: "Customer update synced" });
      }

      case "table_update": {
        const { tableId, occupied } = payload;
        const { error } = await supabase
          .from("bar_tables")
          .update({ occupied })
          .eq("id", tableId);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, id, message: "Table update synced" });
      }

      case "inventory_note": {
        const { productId } = payload;
        const { error } = await supabase
          .from("products")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", productId);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, id, message: "Inventory note synced" });
      }

      default:
        return NextResponse.json({ error: `Unknown operation kind: ${kind}` }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
