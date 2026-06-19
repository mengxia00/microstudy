"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import KnowledgeMap from "@/components/KnowledgeMap";
import ProgressBar from "@/components/ProgressBar";
import { LearningState, CourseData } from "@/types";
import { loadState, getProgress } from "@/lib/stateManager";
import { Home, BookOpen, ArrowLeft } from "lucide-react";

export default function MapPage() {
  const router = useRouter();
  const [state, setState] = useState<LearningState | null>(null);
  const [courseData, setCourseData] = useState<CourseData | null>(null);

  useEffect(() => {
    const savedState = loadState();
    const savedCourse = localStorage.getItem("microstudy_course");

    if (!savedState || !savedCourse) {
      router.push("/");
      return;
    }

    setState(savedState);
    setCourseData(JSON.parse(savedCourse));
  }, [router]);

  const handleSelectCard = (cardId: string) => {
    if (!courseData || !state) return;

    // 找到卡片索引
    const allCards = courseData.chapters.flatMap((ch) =>
      ch.points.map((p) => ({ chapterId: ch.id, point: p }))
    );
    const idx = allCards.findIndex((c) => c.point.id === cardId);

    if (idx === -1) return;

    // 更新状态并跳转
    const newState = { ...state, currentCardIndex: idx };
    localStorage.setItem("microstudy_state", JSON.stringify(newState));
    router.push("/study");
  };

  if (!state || !courseData) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const progress = getProgress(state);

  return (
    <main className="flex-1 p-4">
      <div className="max-w-5xl mx-auto">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-600"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>

          <button
            onClick={() => router.push("/study")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            继续学习
          </button>
        </div>

        {/* 进度概览 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">学习进度</h2>
          <ProgressBar
            current={progress.mastered + progress.learning}
            total={progress.total}
            mastered={progress.mastered}
            learning={progress.learning}
            needsReview={progress.needsReview}
          />
        </div>

        {/* 知识地图 */}
        <KnowledgeMap
          courseData={courseData}
          cardStates={state.cardStates}
          onSelectCard={handleSelectCard}
        />
      </div>
    </main>
  );
}
