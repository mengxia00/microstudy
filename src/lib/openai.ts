import OpenAI from "openai";

// 延迟初始化，避免在没有 API Key 时构建失败
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("缺少 OPENAI_API_KEY 环境变量，请在 .env.local 中配置");
    }
    _client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    });
  }
  return _client;
}

// 默认模型，可通过环境变量覆盖
export const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export default getClient;
