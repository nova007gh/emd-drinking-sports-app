import { NextRequest, NextResponse } from "next/server";
import { requireAuth, readJsonBody } from "@/lib/api/guards";

export async function POST(req: NextRequest) {
  // Without this, anyone who finds the deployment can spend your OpenAI quota.
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const { body } = parsed;

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  // Cap the caller-supplied question and snapshot: both are interpolated
  // straight into the prompt, so an unbounded value is directly billable.
  const question = String(body.question ?? "").slice(0, 2000);
  if (!question.trim()) {
    return NextResponse.json({ error: "A question is required" }, { status: 400 });
  }

  if (!apiKey || !model) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY and OPENAI_MODEL must be configured on the server." },
      { status: 503 }
    );
  }

  const snapshot = JSON.stringify(body.snapshot ?? {}).slice(0, 20000);

  const prompt = [
    "You are EMD AI Assistant for a Ghanaian sports bar.",
    "Give concise, practical business analysis based only on the supplied business snapshot.",
    "Never invent sales, stock, debts, or customer values.",
    `Question: ${question}`,
    `Business snapshot: ${snapshot}`
  ].join("\n");

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
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
  } catch {
    return NextResponse.json(
      { error: "Failed to reach the AI provider" },
      { status: 502 }
    );
  }

  if (!response.ok) {
    // Do not forward an upstream body verbatim; it can echo keys or internals.
    return NextResponse.json(
      { error: `AI provider returned ${response.status}` },
      { status: response.status }
    );
  }

  const data = await response.json();
  const parts: string[] = Array.isArray(data?.output)
    ? data.output.flatMap((item: { content?: unknown[] }) => item.content ?? [])
        .filter((item: { type: string }) => item?.type === "output_text")
        .map((item: { text: string }) => (typeof item?.text === "string" ? item.text : ""))
    : [];
  const text: string = typeof data?.output_text === "string" ? data.output_text : parts.join("\n");

  return NextResponse.json({ text });
}
