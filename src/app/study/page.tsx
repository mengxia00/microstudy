"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
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
  ReviewMode,
} from "@/types";
import {
  loadState,
  saveState,
  updateCardState,
  getProgress,
  getAllCards,
  getNextCardIndex,
  updateProjectProgress,
  addWrongCard,
  removeWrongCard,
  getWrongCards,
} from "@/lib/stateManager";
import { useSearchParams } from "next/navigation";
import { Home, Map, RotateCcw, X, ArrowLeft, ChevronLeft, ChevronRight, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <StudyContent />
    </Suspense>
  );
}

function StudyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wrongPractice = searchParams.get("wrong") === "true";
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
  const [reviewMode, setReviewMode] = useState<ReviewMode>("recite");
  const [convertedCard, setConvertedCard] = useState<KnowledgePoint | null>(null);
  const [wrongCards, setWrongCards] = useState<{ chapterTitle: string; point: KnowledgePoint }[]>([]);
  const [allHidden, setAllHidden] = useState(false);
  const [hiddenCards, setHiddenCards] = useState<Set<string>>(new Set());

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

    if (wrongPractice) {
      // 错题模式：只加载错题
      const wrong = getWrongCards(savedState, course);
      setWrongCards(wrong);
      if (wrong.length > 0) {
        setCurrentCard({ chapterTitle: wrong[0].chapterTitle, point: wrong[0].point });
      }
    } else {
      // 正常模式
      const allCards = getAllCards(course);
      const idx = savedState.currentCardIndex;
      if (idx >= 0 && idx < allCards.length) {
        setCurrentCard({
          chapterTitle: allCards[idx].chapterTitle,
          point: allCards[idx].point,
        });
      }
    }
  }, [router, wrongPractice]);

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
          let newState = updateCardState(state, currentCard.point.id, {
            status: "mastered",
            attempts: (state.cardStates[currentCard.point.id]?.attempts || 0) + 1,
            lastAnswer: answer,
            mastery: 1,
          });
          // 答对了，从错题库移除
          newState = removeWrongCard(newState, currentCard.point.id);
          setState(newState);
          saveState(newState);
          updateProjectProgress(newState);

          // 延迟切换到下一张
          setTimeout(() => {
            goToNextCard(newState);
          }, 1500);
        } else {
          // 更新为学习中
          let newState = updateCardState(state, currentCard.point.id, {
            status: "learning",
            attempts: (state.cardStates[currentCard.point.id]?.attempts || 0) + 1,
            lastAnswer: answer,
          });
          // 答错了，加入错题库
          newState = addWrongCard(newState, currentCard.point.id);
          setState(newState);
          saveState(newState);
          updateProjectProgress(newState);
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

      if (wrongPractice) {
        // 错题模式：找下一张未掌握的错题
        const currentWrongCards = getWrongCards(currentState, courseData);
        const nextWrong = currentWrongCards.find(
          (c) => currentState.cardStates[c.point.id]?.status !== "mastered"
        );
        if (!nextWrong) {
          setCompleted(true);
          return;
        }
        setCurrentCard({ chapterTitle: nextWrong.chapterTitle, point: nextWrong.point });
      } else {
        // 正常模式
        const allCards = getAllCards(courseData);
        const nextIdx = getNextCardIndex(currentState);

        if (nextIdx === -1) {
          setCompleted(true);
          return;
        }

        const newState = { ...currentState, currentCardIndex: nextIdx };
        setState(newState);
        saveState(newState);
        updateProjectProgress(newState);

        setCurrentCard({
          chapterTitle: allCards[nextIdx].chapterTitle,
          point: allCards[nextIdx].point,
        });
      }
      setFeedback("");
      setCorrect(null);
      setHistory([]);
    },
    [courseData, wrongPractice]
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

  // 题型转换
  const handleConvert = async (targetType: "mcq" | "fill") => {
    if (!currentCard || loading) return;
    setLoading(true);
    setFeedback("");
    setCorrect(null);
    try {
      const res = await apiFetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: currentCard.point.id,
          userAnswer: "",
          history,
          action: targetType === "mcq" ? "convert_choice" : "convert_fill",
          question: JSON.stringify({
            title: currentCard.point.title,
            content: currentCard.point.content,
            keywords: currentCard.point.keywords,
            targetType,
          }),
        }),
      });
      if (!res.ok) throw new Error("转换失败");
      const data: TutorResponse = await res.json();
      if (data.convertedCard) {
        setConvertedCard({
          ...currentCard.point,
          type: targetType,
          content: data.convertedCard.content,
          options: data.convertedCard.options,
          correctAnswer: data.convertedCard.correctAnswer,
          originalQuestion: data.convertedCard.content,
        });
        setFeedback("");
      }
    } catch {
      setFeedback("转换失败，请重试");
      setCorrect(null);
    } finally {
      setLoading(false);
    }
  };

  // 清除转换
  const handleClearConvert = () => {
    setConvertedCard(null);
    setFeedback("");
    setCorrect(null);
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

  // 跳转到指定卡片
  const goToCard = (idx: number) => {
    if (!courseData || !state) return;
    const allCards = getAllCards(courseData);
    if (idx < 0 || idx >= allCards.length) return;

    const newState = { ...state, currentCardIndex: idx };
    setState(newState);
    saveState(newState);

    setCurrentCard({
      chapterTitle: allCards[idx].chapterTitle,
      point: allCards[idx].point,
    });
    setFeedback("");
    setCorrect(null);
    setHistory([]);
    setConvertedCard(null);
  };

  const handlePrev = () => goToCard(state!.currentCardIndex - 1);
  const handleNext = () => goToCard(state!.currentCardIndex + 1);

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
    updateProjectProgress(newState);
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
          <div className="relative h-full lg:h-auto overflow-y-auto p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3 lg:hidden">
              <span className="text-sm font-medium text-gray-600">知识地图</span>
              <button
                onClick={() => setShowMap(false)}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
            className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-600"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>

          <div className="flex items-center gap-2">
            {/* 全局隐藏/显示答案 */}
            {reviewMode === "recite" && (
              <button
                onClick={() => setAllHidden(!allHidden)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm text-gray-600"
                title={allHidden ? "显示所有答案" : "隐藏所有答案"}
              >
                {allHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {allHidden ? "显示" : "隐藏"}答案
              </button>
            )}
            <button
              onClick={() => setShowMap(!showMap)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
            >
              <Map className="w-4 h-4" />
              知识地图
            </button>
          </div>
        </div>

        {/* 错题练习模式提示 */}
        {wrongPractice && (
          <div className="flex items-center justify-between px-4 py-2.5 mb-4 rounded-xl bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">错题练习模式</span>
              <span className="text-sm text-orange-500">({wrongCards.length} 题待复习)</span>
            </div>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-orange-600 underline hover:text-orange-800"
            >
              退出
            </button>
          </div>
        )}

        {/* 进度条 */}
        <div className="mb-4">
          <ProgressBar
            current={progress.mastered + progress.learning}
            total={progress.total}
            mastered={progress.mastered}
            learning={progress.learning}
            needsReview={progress.needsReview}
          />
        </div>

        {/* 背诵/刷题 模式切换 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setReviewMode("recite"); setConvertedCard(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              reviewMode === "recite"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            📖 背诵模式
          </button>
          <button
            onClick={() => setReviewMode("quiz")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              reviewMode === "quiz"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ✏️ 刷题模式
          </button>
        </div>

        {/* 刷题模式：题型转换按钮 */}
        {reviewMode === "quiz" && !convertedCard && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleConvert("mcq")}
              disabled={loading}
              className="flex-1 py-2 rounded-lg border border-purple-300 bg-purple-50 text-purple-700 text-sm hover:bg-purple-100 disabled:opacity-50 transition-colors"
            >
              转选择题
            </button>
            <button
              onClick={() => handleConvert("fill")}
              disabled={loading}
              className="flex-1 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-sm hover:bg-amber-100 disabled:opacity-50 transition-colors"
            >
              转填空题
            </button>
          </div>
        )}

        {/* 刷题模式：已转换提示 */}
        {reviewMode === "quiz" && convertedCard && (
          <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
            <span className="text-sm text-green-700">✅ 已转换为{convertedCard.type === "mcq" ? "选择题" : "填空题"}</span>
            <button
              onClick={handleClearConvert}
              className="text-sm text-green-600 underline hover:text-green-800"
            >
              还原
            </button>
          </div>
        )}

        {/* 卡片 */}
        <div className="mb-4">
          <FlashCard
            key={(convertedCard || currentCard.point).id}
            point={convertedCard || currentCard.point}
            chapterTitle={currentCard.chapterTitle}
            status={state.cardStates[currentCard.point.id]?.status || "unlearned"}
            cardIndex={state.currentCardIndex}
            totalCards={state.totalCards}
            reviewMode={reviewMode}
            globalHidden={allHidden}
            cardHidden={hiddenCards.has((convertedCard || currentCard.point).id)}
            onToggleAnswer={() => {
              const id = (convertedCard || currentCard.point).id;
              setHiddenCards((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }}
          />
        </div>

        {/* 上一题 / 下一题 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrev}
            disabled={wrongPractice || state.currentCardIndex <= 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm text-gray-600"
          >
            <ChevronLeft className="w-4 h-4" />
            上一题
          </button>

          <span className="text-sm text-gray-400">
            {wrongPractice
              ? `错题 ${wrongCards.findIndex((c) => c.point.id === currentCard?.point.id) + 1} / ${wrongCards.length}`
              : `${state.currentCardIndex + 1} / ${state.totalCards}`
            }
          </span>

          <button
            onClick={handleNext}
            disabled={wrongPractice || state.currentCardIndex >= state.totalCards - 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm text-gray-600"
          >
            下一题
            <ChevronRight className="w-4 h-4" />
          </button>
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
