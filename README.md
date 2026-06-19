# MicroStudy — AI 引导式微复习系统

适合 ADHD 用户的 AI 复习工具。上传学习资料，AI 自动拆成微卡片，每次只显示一个知识点，用户复述后 AI 纠错。

## 快速开始

### 1. 配置 API Key

编辑 `.env.local` 文件：

```bash
# 必填
OPENAI_API_KEY=sk-your-api-key-here

# 可选：中转站地址
OPENAI_BASE_URL=https://api.openai.com/v1

# 可选：模型选择（默认 gpt-4o-mini）
OPENAI_MODEL=gpt-4o-mini
```

### 2. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000

### 3. 使用流程

1. 上传 .md 或 .txt 学习资料
2. 选择学习模式（考前速成/正常复习/只背重点/抽题模式）
3. 点击"开始学习"
4. AI 自动解析知识点
5. 逐个复述，AI 纠错

## 功能特性

- **文件上传**：支持 .md / .txt 格式
- **AI 解析**：自动提取知识点，生成微卡片
- **四种模式**：考前速成、正常复习、只背重点、抽题模式
- **智能纠错**：用户复述后 AI 判断对错
- **提示功能**：遇到困难可获取提示
- **知识地图**：查看整体知识结构
- **进度追踪**：localStorage 保存学习进度
- **ADHD 友好**：一次只显示一个知识点

## 页面路由

| 路由 | 功能 |
|------|------|
| `/` | 首页，上传文件，选择模式 |
| `/map` | 知识地图，查看知识结构 |
| `/study` | 复习页，核心交互 |

## 技术栈

- Next.js 14 (App Router)
- Tailwind CSS
- OpenAI API（支持中转站）

## 项目结构

```
src/
├── app/
│   ├── page.tsx           # 首页
│   ├── map/page.tsx       # 知识地图
│   ├── study/page.tsx     # 复习页
│   └── api/
│       ├── parse/route.ts # 解析 API
│       └── tutor/route.ts # 辅导 API
├── components/            # UI 组件
├── lib/
│   ├── openai.ts          # OpenAI 客户端
│   └── stateManager.ts    # 状态管理
└── types/index.ts         # 类型定义
```
