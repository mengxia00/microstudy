import { LearningState, CardState, CardStatus, CourseData, StudyMode } from "@/types";

const STORAGE_KEY = "microstudy_state";

// 生成唯一课程ID
function generateCourseId(title: string): string {
  return `${title}_${Date.now()}`;
}

// 从 localStorage 读取状态
export function loadState(): LearningState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LearningState;
  } catch {
    return null;
  }
}

// 保存状态到 localStorage
export function saveState(state: LearningState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}

// 创建新的学习状态
export function createLearningState(
  courseData: CourseData,
  mode: StudyMode
): LearningState {
  const cardStates: Record<string, CardState> = {};

  for (const chapter of courseData.chapters) {
    for (const point of chapter.points) {
      cardStates[point.id] = {
        status: "unlearned",
        attempts: 0,
        lastAnswer: "",
        mistakes: [],
        mastery: 0,
      };
    }
  }

  const totalCards = Object.keys(cardStates).length;

  return {
    courseId: generateCourseId(courseData.courseTitle),
    courseTitle: courseData.courseTitle,
    cardStates,
    currentCardIndex: 0,
    totalCards,
    startedAt: new Date().toISOString(),
    mode,
  };
}

// 获取所有卡片的扁平列表
export function getAllCards(courseData: CourseData) {
  const cards: { chapterId: string; chapterTitle: string; point: import("@/types").KnowledgePoint }[] = [];
  for (const chapter of courseData.chapters) {
    for (const point of chapter.points) {
      cards.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        point,
      });
    }
  }
  return cards;
}

// 更新单张卡片状态
export function updateCardState(
  state: LearningState,
  cardId: string,
  updates: Partial<CardState>
): LearningState {
  const current = state.cardStates[cardId] || {
    status: "unlearned" as CardStatus,
    attempts: 0,
    lastAnswer: "",
    mistakes: [],
    mastery: 0,
  };

  return {
    ...state,
    cardStates: {
      ...state.cardStates,
      [cardId]: { ...current, ...updates },
    },
  };
}

// 计算进度
export function getProgress(state: LearningState) {
  const entries = Object.values(state.cardStates);
  const mastered = entries.filter((s) => s.status === "mastered").length;
  const learning = entries.filter((s) => s.status === "learning").length;
  const needsReview = entries.filter((s) => s.status === "needs_review").length;
  const unlearned = entries.filter((s) => s.status === "unlearned").length;

  return { mastered, learning, needsReview, unlearned, total: entries.length };
}

// 获取下一张未学/需复习的卡片索引
export function getNextCardIndex(state: LearningState): number {
  const cards = Object.entries(state.cardStates);

  // 优先找需复习的
  for (let i = 0; i < cards.length; i++) {
    if (cards[i][1].status === "needs_review") return i;
  }

  // 再找未学的
  for (let i = 0; i < cards.length; i++) {
    if (cards[i][1].status === "unlearned") return i;
  }

  // 再找学习中的
  for (let i = 0; i < cards.length; i++) {
    if (cards[i][1].status === "learning") return i;
  }

  return -1; // 全部完成
}

// 清除学习状态
export function clearState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
