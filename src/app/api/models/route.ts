import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET(req: NextRequest) {
  try {
    const headerKey = req.headers.get("x-api-key");
    const headerBase = req.headers.get("x-api-base");

    const apiKey = headerKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "缺少 API Key" }, { status: 400 });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: headerBase || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    });

    const models = await client.models.list();
    const modelIds = models.data
      .map((m) => m.id)
      .filter((id) => id.includes("gpt") || id.includes("o1") || id.includes("o3") || id.includes("claude"))
      .sort();

    return NextResponse.json({ models: modelIds });
  } catch (error: unknown) {
    console.error("Models API error:", error);
    const message = error instanceof Error ? error.message : "获取模型列表失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
