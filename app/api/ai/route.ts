import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY and OPENAI_MODEL must be configured on the server." },
      { status: 503 }
    );
  }

  const prompt = [
    "You are EMD AI Assistant for a Ghanaian sports bar.",
    "Give concise, practical business analysis based only on the supplied business snapshot.",
    "Never invent sales, stock, debts, or customer values.",
    `Question: ${String(body.question ?? "")}`,
    `Business snapshot: ${JSON.stringify(body.snapshot ?? {})}`
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: prompt
    })
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: text }, { status: response.status });
  }

  const data = await response.json();
  const text =
    data.output_text ??
    data.output?.flatMap((item: { content?: unknown[] }) => item.content ?? [])
      ?.filter((item: { type: string }) => item.type === "output_text")
      ?.map((item: { text: string }) => item.text)
      ?.join("\n") ??
    "No response.";

  return NextResponse.json({ text });
}
