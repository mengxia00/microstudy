"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import FlashCard from "@/components/FlashCard";
import AnswerInput from "@/components/AnswerInput";
import Feedback from "@/components/Feedback";
import ProgressBar from "@/components/ProgressBar";
import KnowledgeMap from "@/components/KnowledgeMap";
import {
  LearningState,
  CourseData,
  KnowledgePoint,
  TutorResponse,
} from "@/types";
import {
  loadState,
  saveState,
  updateCardState,
  getProgress,
  getAllCards,
  getNextCardIndex,
} from "@/lib/stateManager";
import { Home, Map, RotateCcw } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function StudyPage() {
  const router = useRouter();
  const [state, setState] = useState<LearningState | null>(null);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [currentCard, setCurrentCard] = useState<{
    chapterTitle: string;
    point: KnowledgePoint;
  } | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ role: "assistant" | "user"; content: string }[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [completed, setCompleted] = useState(false);

  // 加载数据
  useEffect(() => {
    const savedState = loadState();
    const savedCourse = localStorage.getItem("microstudy_course");

    if (!savedState || !savedCourse) {
      router.push("/");
      return;
    }

    const course: CourseData = JSON.parse(savedCourse);
    setState(savedState);
    setCourseData(course);

    // 获取当前卡片
    const allCards = getAllCards(course);
    const idx = savedState.currentCardIndex;
    if (idx >= 0 && idx < allCards.length) {
      setCurrentCard({
        chapterTitle: allCards[idx].chapterTitle,
        point: allCards[idx].point,
      });
    }
  }, [router]);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "h") {
          e.preventDefault();
          handleHint();
        } else if (e.key === "q") {
          e.preventDefault();
          // Toggle ask input (handled in AnswerInput)
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // 调用 Tutor API
  const callTutor = useCallback(
    async (action: "submit" | "hint" | "simplify" | "ask", answer: string, question?: string) => {
      if (!state || !currentCard) return;

      setLoading(true);
      try {
        const res = await apiFetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId: currentCard.point.id,
            userAnswer: answer,
            history,
            action,
            question,
          }),
        });

        if (!res.ok) {
          throw new Error("请求失败");
        }

        const data: TutorResponse = await res.json();
        setFeedback(data.feedback);
        setCorrect(data.correct);

        // 更新历史
        setHistory((prev) => [
          ...prev,
          { role: "user", content: answer || `[${action}]` },
          { role: "assistant", content: data.feedback },
        ]);

        // 如果正确，更新状态并切换到下一张
        if (data.correct) {
          const newState = updateCardState(state, currentCard.point.id, {
            status: "mastered",
            attempts: (state.cardStates[currentCard.point.id]?.attempts || 0) + 1,
            lastAnswer: answer,
            mastery: 1,
          });
          setState(newState);
          saveState(newState);

          // 延迟切换到下一张
          setTimeout(() => {
            goToNextCard(newState);
          }, 1500);
        } else {
          // 更新为学习中
          const newState = updateCardState(state, currentCard.point.id, {
            status: "learning",
            attempts: (state.cardStates[currentCard.point.id]?.attempts || 0) + 1,
            lastAnswer: answer,
          });
          setState(newState);
          saveState(newState);
        }
      } catch (err) {
        setFeedback("哎呀，出错了，请重试吧~");
        setCorrect(null);
      } finally {
        setLoading(false);
      }
    },
    [state, currentCard, history]
  );

  // 切换到下一张卡片
  const goToNextCard = useCallback(
    (currentState: LearningState) => {
      if (!courseData) return;

      const allCards = getAllCards(courseData);
      const nextIdx = getNextCardIndex(currentState);

      if (nextIdx === -1) {
        setCompleted(true);
        return;
      }

      const newState = { ...currentState, currentCardIndex: nextIdx };
      setState(newState);
      saveState(newState);

      setCurrentCard({
        chapterTitle: allCards[nextIdx].chapterTitle,
        point: allCards[nextIdx].point,
      });
      setFeedback("");
      setCorrect(null);
      setHistory([]);
    },
    [courseData]
  );

  // 提交复述
  const handleSubmit = (answer: string) => {
    callTutor("submit", answer);
  };

  // 提示
  const handleHint = () => {
    callTutor("hint", "");
  };

  // 太多了
  const handleSimplify = () => {
    callTutor("simplify", "");
  };

  // 提问
  const handleAsk = (question: string) => {
    callTutor("ask", "", question);
  };

  // 选择卡片（从知识地图）
  const handleSelectCard = (cardId: string) => {
    if (!courseData) return;

    const allCards = getAllCards(courseData);
    const idx = allCards.findIndex((c) => c.point.id === cardId);
    if (idx === -1) return;

    const newState = { ...state!, currentCardIndex: idx };
    setState(newState);
    saveState(newState);

    setCurrentCard({
      chapterTitle: allCards[idx].chapterTitle,
      point: allCards[idx].point,
    });
    setFeedback("");
    setCorrect(null);
    setHistory([]);
    setShowMap(false);
  };

  // 重新开始
  const handleRestart = () => {
    if (!courseData) return;
    const newState = {
      ...state!,
      currentCardIndex: 0,
      cardStates: {},
    };
    setState(newState);
    saveState(newState);
    setCompleted(false);
    // Reload
    window.location.reload();
  };

  if (!state || !courseData || !currentCard) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // 完成页面
  if (completed) {
    const progress = getProgress(state);
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h1 className="text-3xl font-bold text-green-600 mb-4">复习完成！</h1>
            <p className="text-gray-600 mb-6">
              共 {progress.total} 个知识点，已掌握 {progress.mastered} 个
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRestart}
                className="px-6 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                重新复习
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Home className="w-5 h-5" />
                返回首页
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const progress = getProgress(state);

  return (
    <main className="flex-1 flex flex-col lg:flex-row">
      {/* 左侧知识地图（桌面端常驻，移动端抽屉） */}
      {showMap && (
        <div className="fixed inset-0 z-50 lg:relative lg:z-0 lg:w-80 lg:flex-shrink-0">
          <div
            className="absolute inset-0 bg-black/50 lg:hidden"
            onClick={() => setShowMap(false)}
          />
          <div className="relative h-full lg:h-auto overflow-auto p-4 bg-gray-50">
            <KnowledgeMap
              courseData={courseData}
              cardStates={state.cardStates}
              onSelectCard={handleSelectCard}
              currentCardId={currentCard.point.id}
            />
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col p-4 max-w-3xl mx-auto w-full">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Home className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
          >
            <Map className="w-4 h-4" />
            知识地图
          </button>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <ProgressBar
            current={progress.mastered + progress.learning}
            total={progress.total}
            mastered={progress.mastered}
            learning={progress.learning}
            needsReview={progress.needsReview}
          />
        </div>

        {/* 卡片 */}
        <div className="mb-6">
          <FlashCard
            point={currentCard.point}
            chapterTitle={currentCard.chapterTitle}
            status={state.cardStates[currentCard.point.id]?.status || "unlearned"}
            cardIndex={state.currentCardIndex}
            totalCards={state.totalCards}
          />
        </div>

        {/* 反馈区域 */}
        <div className="mb-4">
          <Feedback feedback={feedback} correct={correct} loading={loading} />
        </div>

        {/* 输入区域 */}
        <div className="mt-auto">
          <AnswerInput
            onSubmit={handleSubmit}
            onHint={handleHint}
            onSimplify={handleSimplify}
            onAsk={handleAsk}
            disabled={loading || correct === true}
          />
        </div>
      </div>
    </main>
  );
}
