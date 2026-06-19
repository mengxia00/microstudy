// 卡片类型
export type CardType =
  | "definition"
  | "list"
  | "comparison"
  | "formula"
  | "process"
  | "example"
  | "qa"
  | "mistake";

// 优先级
export type Priority = "high" | "medium" | "low";

// 卡片状态
export type CardStatus = "unlearned" | "learning" | "mastered" | "needs_review";

// 学习模式
export type StudyMode = "exam_cram" | "normal" | "key_only" | "random";

// 单个知识点
export interface KnowledgePoint {
  id: string;
  title: string;
  type: CardType;
  priority: Priority;
  content: string;
  keywords: string[];
  question: string;
  answer: string;
  commonMistakes: string[];
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
}

// Tutor API 请求
export interface TutorRequest {
  cardId: string;
  userAnswer: string;
  history: { role: "assistant" | "user"; content: string }[];
  action: "submit" | "hint" | "simplify" | "ask";
  question?: string;
}

// Tutor API 响应
export interface TutorResponse {
  feedback: string;
  standardAnswer: string;
  correct: boolean;
  nextCard: string;
  progress: { current: number; total: number };
}

// Parse API 请求
export interface ParseRequest {
  content: string;
  mode: StudyMode;
  examDate?: string;
}
