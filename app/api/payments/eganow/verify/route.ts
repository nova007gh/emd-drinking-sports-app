import { NextRequest, NextResponse } from "next/server";
import { requireAuth, readJsonBody } from "@/lib/api/guards";

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

/** Only pass through a known allowlist of fields the merchant API should accept. */
function sanitizeVerifyPayload(payload: Record<string, unknown>) {
  const allowed = ["reference", "transactionId", "transaction_id", "orderId"];
  const clean: Record<string, unknown> = {};
  for (const key of allowed) {
    if (payload[key] !== undefined) clean[key] = payload[key];
  }
  return clean;
}

export async function POST(req: NextRequest) {
  // Anyone able to reach this route could otherwise query transaction
  // status against the configured merchant account.
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const base = process.env.EGANOW_API_BASE_URL;
  const apiKey = process.env.EGANOW_API_KEY;
  const path = process.env.EGANOW_VERIFY_PATH;

  if (!base || !apiKey || !path) {
    return NextResponse.json({
      error: "Eganow merchant verification is not configured. Set EGANOW_API_BASE_URL, EGANOW_API_KEY and EGANOW_VERIFY_PATH."
    }, { status: 503 });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;

  const upstream = await fetch(joinUrl(base, path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(sanitizeVerifyPayload(parsed.body))
  });

  const text = await upstream.text();
  let data: unknown = text;
  try { data = JSON.parse(text); } catch {}

  return NextResponse.json({ data }, { status: upstream.status });
}
