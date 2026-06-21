import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ParseRequest, CourseData } from "@/types";

// 从请求头或环境变量获取配置
function getClientFromReq(req: NextRequest): { client: OpenAI; model: string } {
  const headerKey = req.headers.get("x-api-key");
  const headerBase = req.headers.get("x-api-base");
  const headerModel = req.headers.get("x-api-model");

  const apiKey = headerKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 API Key，请在设置中配置");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: headerBase || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  });

  const model = headerModel || process.env.OPENAI_MODEL || "gpt-4o-mini";
  return { client, model };
}

export async function POST(req: NextRequest) {
  try {
    const { client, model } = getClientFromReq(req);

    const body: ParseRequest = await req.json();
    const { content, mode, examDate } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "请提供学习资料内容" }, { status: 400 });
    }

    // 根据模式调整 prompt
    const modeInstructions: Record<string, string> = {
      exam_cram: "考前速成模式：只提取最高频考点，每个知识点尽量精简。",
      normal: "正常复习模式：全面提取知识点，按重要性排序。",
      key_only: "只背重点模式：只提取核心定义、关键公式、必考列表。",
      random: "抽题模式：提取适合随机抽查的知识点，偏重理解和应用。",
    };

    const modeInstruction = modeInstructions[mode] || modeInstructions.normal;
    const examInfo = examDate ? `\n考试时间：${examDate}，请根据紧迫程度调整优先级。` : "";

    const systemPrompt = `你是一个考试复习资料整理助手。

核心原则：严格忠实于用户原始资料，不要编造、不要拓展、不要补充资料中没有的内容。这是紧急复习，不是拓展学习。

请你：
1. 按章节整理知识结构；
2. 提取适合考试复习的知识点；
3. 每个知识点拆成"一次只学一点"的微卡片；
4. 识别原始资料中的题型，原样保留：
   - 选择题：保留题目和所有选项（A/B/C/D...），标注正确答案
   - 填空题：保留题目，用 ___ 标记空格位置
   - 判断题：保留题目，标注对/错
   - 简答题/论述题：保留原问题
5. 标注优先级 high / medium / low；
6. 修正明显 OCR/转码错误，但不改变原意；
7. 输出 JSON。

${modeInstruction}${examInfo}

输出格式（严格 JSON）：
{
  "courseTitle": "课程名称",
  "chapters": [
    {
      "id": "ch1",
      "title": "章节标题",
      "priority": "high|medium|low",
      "points": [
        {
          "id": "ch1-p1",
          "title": "知识点标题",
          "type": "definition | list | comparison | formula | process | example | mcq | fill | judge | qa",
          "priority": "high|medium|low",
          "content": "知识点内容（完整保留原文）",
          "keywords": ["关键词1", "关键词2"],
          "originalQuestion": "如果是题型（选择/填空/判断），这里是原始题目，没有则为空",
          "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
          "correctAnswer": "如果是题型，这里是正确答案",
          "explanation": "选择题/判断题的答案解析（简要说明为什么选这个），没有则为空"
        }
      ]
    }
  ]
}

type 字段说明：
- definition：定义
- list：列表/条目
- comparison：对比
- formula：公式
- process：流程/步骤
- example：案例
- mcq：选择题（必须保留原始选项）
- fill：填空题（空格用 ___ 表示）
- judge：判断题
- qa：简答/论述题`;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `请整理以下学习资料：\n\n${content}` },
      ],
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "AI 解析失败，请重试" }, { status: 500 });
    }

    // 提取 JSON（兼容 markdown 代码块包裹的情况）
    let jsonStr = raw.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    // 如果开头不是 {，尝试找到第一个 {
    if (!jsonStr.startsWith("{")) {
      const idx = jsonStr.indexOf("{");
      if (idx !== -1) jsonStr = jsonStr.slice(idx);
    }

    let courseData: CourseData;
    try {
      courseData = JSON.parse(jsonStr);
    } catch {
      console.error("JSON parse failed, raw:", raw);
      return NextResponse.json({ error: "AI 返回格式异常，请重试" }, { status: 500 });
    }

    // 基本验证
    if (!courseData.courseTitle || !Array.isArray(courseData.chapters)) {
      return NextResponse.json({ error: "解析结果格式异常，请重试" }, { status: 500 });
    }

    return NextResponse.json(courseData);
  } catch (error: unknown) {
    console.error("Parse API error:", error);
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
