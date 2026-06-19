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

用户会上传课程资料，其中可能存在 PDF 转 Word 错误。

请你：
1. 按章节整理知识结构；
2. 提取适合考试复习的知识点；
3. 每个知识点拆成"一次只学一点"的微卡片；
4. 标注类型：definition / list / comparison / formula / process / example / qa / mistake；
5. 标注优先级 high / medium / low；
6. 修正明显 OCR 错误，但不要编造资料中没有依据的内容；
7. 输出 JSON。

注意：
- 定义类卡片：给出完整定义 + 关键词
- 列表类卡片：给出完整列表 + 口诀
- 对比类卡片：给出对比表格
- 流程类卡片：按步骤列出
- 每张卡片尽量控制在 50 字以内
- question 字段：出一道检验理解的简答题
- answer 字段：标准答案
- commonMistakes 字段：常见错误

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
          "type": "definition",
          "priority": "high",
          "content": "知识点内容",
          "keywords": ["关键词1", "关键词2"],
          "question": "检验理解的问题",
          "answer": "标准答案",
          "commonMistakes": ["常见错误1"]
        }
      ]
    }
  ]
}`;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `请整理以下学习资料：\n\n${content}` },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      return NextResponse.json({ error: "AI 解析失败，请重试" }, { status: 500 });
    }

    const courseData: CourseData = JSON.parse(result);

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
