"use client";

import { KnowledgePoint, CardStatus } from "@/types";
import { BookOpen, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface FlashCardProps {
  point: KnowledgePoint;
  chapterTitle: string;
  status: CardStatus;
  cardIndex: number;
  totalCards: number;
}

const statusConfig: Record<CardStatus, { icon: React.ReactNode; color: string; label: string }> = {
  unlearned: { icon: <BookOpen className="w-5 h-5" />, color: "text-blue-500", label: "未学" },
  learning: { icon: <Clock className="w-5 h-5" />, color: "text-yellow-500", label: "学习中" },
  mastered: { icon: <CheckCircle className="w-5 h-5" />, color: "text-green-500", label: "已掌握" },
  needs_review: { icon: <AlertCircle className="w-5 h-5" />, color: "text-red-500", label: "需复习" },
};

export default function FlashCard({
  point,
  chapterTitle,
  status,
  cardIndex,
  totalCards,
}: FlashCardProps) {
  const config = statusConfig[status];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{chapterTitle}</span>
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>

      {/* 进度指示 */}
      <div className="text-xs text-gray-400 mb-4">
        {cardIndex + 1} / {totalCards}
      </div>

      {/* 知识点标题 */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">{point.title}</h2>

      {/* 知识点内容 */}
      <div className="bg-blue-50 rounded-xl p-4 mb-4">
        <p className="text-gray-700 leading-relaxed">{point.content}</p>
      </div>

      {/* 关键词 */}
      {point.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {point.keywords.map((kw, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* 检验问题 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-600 mb-1">检验问题：</p>
        <p className="text-gray-800">{point.question}</p>
      </div>
    </div>
  );
}
