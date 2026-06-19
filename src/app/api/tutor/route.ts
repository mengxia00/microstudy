import { NextRequest, NextResponse } from "next/server";
import getClient, { MODEL } from "@/lib/openai";
import { TutorRequest, TutorResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: TutorRequest = await req.json();
    const { cardId, userAnswer, history, action, question } = body;

    if (!cardId) {
      return NextResponse.json({ error: "缺少 cardId" }, { status: 400 });
    }

    const systemPrompt = `你是一个 ADHD 友好的 AI 复习教练。

你的任务是根据用户上传的课程资料，帮助用户进行考前复习。

核心规则：
1. 每次只讲一个知识点。
2. 每次回复不超过 100 字。
3. 不要一次性列出大量内容。
4. 用户复述后，判断是否正确。
5. 如果正确，说"对，过"，然后给出下一个小点。
6. 如果错误，只指出 1-2 个关键错误，并给出标准表达。
7. 不使用 emoji。
8. 用户说"停""太多了""等一下"时，立即停止扩展。
9. 用户可以随时提问，先简短回答，再问是否继续。
10. 根据资料优先级，优先讲解高频考点。
11. 如果资料有 OCR 错误，先纠正再讲解。
12. 目标是帮助用户建立结构认知，而不是把资料全文总结给用户。

当前卡片 ID：${cardId}
用户操作：${action}`;

    // 构建消息历史
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // 添加历史对话
    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // 根据 action 构建用户消息
    let userMessage = "";
    switch (action) {
      case "submit":
        userMessage = `我的复述：${userAnswer}`;
        break;
      case "hint":
        userMessage = "请给我一个提示。";
        break;
      case "simplify":
        userMessage = "太多了，请简化。";
        break;
      case "ask":
        userMessage = question || "我有问题。";
        break;
    }

    messages.push({ role: "user", content: userMessage });

    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.5,
      max_tokens: 300,
    });

    const aiReply = response.choices[0]?.message?.content || "抱歉，我没能理解，请重试。";

    // 判断是否正确（简单逻辑：AI 回复中包含"对"或"正确"）
    const correct = /对[，,。]|正确|没错|过[。]/.test(aiReply);

    const result: TutorResponse = {
      feedback: aiReply,
      standardAnswer: "",
      correct,
      nextCard: cardId, // 前端根据 correct 决定是否切换
      progress: { current: 0, total: 0 }, // 前端自己计算
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Tutor API error:", error);
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
