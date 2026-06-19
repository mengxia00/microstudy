"use client";

import { CourseData, CardState, CardStatus } from "@/types";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

interface KnowledgeMapProps {
  courseData: CourseData;
  cardStates: Record<string, CardState>;
  onSelectCard: (cardId: string) => void;
  currentCardId?: string;
}

const statusEmoji: Record<CardStatus, string> = {
  unlearned: "🔵",
  learning: "🟡",
  mastered: "🟢",
  needs_review: "🔴",
};

export default function KnowledgeMap({
  courseData,
  cardStates,
  onSelectCard,
  currentCardId,
}: KnowledgeMapProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{courseData.courseTitle}</h3>

      <div className="space-y-2">
        {courseData.chapters.map((chapter) => {
          const isExpanded = expandedChapters.has(chapter.id);
          const chapterPoints = chapter.points;
          const masteredCount = chapterPoints.filter(
            (p) => cardStates[p.id]?.status === "mastered"
          ).length;

          return (
            <div key={chapter.id}>
              {/* 章节标题 */}
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-700">{chapter.title}</span>
                </div>
                <span className="text-sm text-gray-400">
                  {masteredCount}/{chapterPoints.length}
                </span>
              </button>

              {/* 知识点列表 */}
              {isExpanded && (
                <div className="ml-6 space-y-1">
                  {chapterPoints.map((point) => {
                    const status = cardStates[point.id]?.status || "unlearned";
                    const isCurrent = point.id === currentCardId;

                    return (
                      <button
                        key={point.id}
                        onClick={() => onSelectCard(point.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                          isCurrent
                            ? "bg-blue-100 border border-blue-300"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span>{statusEmoji[status]}</span>
                        <span className="text-sm text-gray-700 truncate">
                          {point.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
