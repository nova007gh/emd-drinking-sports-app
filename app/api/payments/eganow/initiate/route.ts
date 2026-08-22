import { NextRequest, NextResponse } from "next/server";

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function POST(req: NextRequest) {
  const base = process.env.EGANOW_API_BASE_URL;
  const apiKey = process.env.EGANOW_API_KEY;
  const path = process.env.EGANOW_INITIATE_PATH;

  if (!base || !apiKey || !path) {
    return NextResponse.json({
      error: "Eganow merchant API is not configured. Set EGANOW_API_BASE_URL, EGANOW_API_KEY and EGANOW_INITIATE_PATH from your Eganow merchant documentation."
    }, { status: 503 });
  }

  const payload = await req.json();

  const upstream = await fetch(joinUrl(base, path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const text = await upstream.text();
  let data: unknown = text;
  try { data = JSON.parse(text); } catch {}

  return NextResponse.json({ data }, { status: upstream.status });
}
