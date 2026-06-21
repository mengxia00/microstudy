// 卡片类型
export type CardType =
  | "definition"
  | "list"
  | "comparison"
  | "formula"
  | "process"
  | "example"
  | "qa"
  | "mcq"    // 选择题
  | "fill"   // 填空题
  | "judge"; // 判断题

// 优先级
export type Priority = "high" | "medium" | "low";

// 卡片状态
export type CardStatus = "unlearned" | "learning" | "mastered" | "needs_review";

// 学习模式
export type StudyMode = "exam_cram" | "normal" | "key_only" | "random";

// 复习模式
export type ReviewMode = "recite" | "quiz"; // 背诵模式 / 刷题模式

// 单个知识点
export interface KnowledgePoint {
  id: string;
  title: string;
  type: CardType;
  priority: Priority;
  content: string;
  keywords: string[];
  originalQuestion?: string;   // 原始题目（选择/填空/判断/简答）
  options?: string[];          // 选择题选项
  correctAnswer?: string;      // 正确答案
  explanation?: string;        // 解析（选择/判断题的答案解析）
}

// 章节
export interface Chapter {
  id: string;
  title: string;
  priority: Priority;
  points: KnowledgePoint[];
}

// 课程知识结构
export interface CourseData {
  courseTitle: string;
  chapters: Chapter[];
}

// 单张卡片的学习状态
export interface CardState {
  status: CardStatus;
  attempts: number;
  lastAnswer: string;
  mistakes: string[];
  mastery: number; // 0-1
  nextReviewAt?: string; // ISO date
}

// 整体学习状态
export interface LearningState {
  courseId: string;
  courseTitle: string;
  cardStates: Record<string, CardState>;
  currentCardIndex: number;
  totalCards: number;
  startedAt: string;
  mode: StudyMode;
  wrongCardIds?: string[];  // 错题卡片ID列表
}

// Tutor API 请求
export interface TutorRequest {
  cardId: string;
  userAnswer: string;
  history: { role: "assistant" | "user"; content: string }[];
  action: "submit" | "hint" | "simplify" | "ask" | "convert_choice" | "convert_fill";
  question?: string;
}

// Tutor API 响应
export interface TutorResponse {
  feedback: string;
  standardAnswer: string;
  correct: boolean;
  nextCard: string;
  progress: { current: number; total: number };
  convertedCard?: {
    type: "mcq" | "fill";
    content: string;
    options?: string[];
    correctAnswer: string;
  };
}

// Parse API 请求
export interface ParseRequest {
  content: string;
  mode: StudyMode;
  examDate?: string;
}
