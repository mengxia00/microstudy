"use client";

import { useState } from "react";
import { KnowledgePoint, CardStatus, ReviewMode } from "@/types";
import { BookOpen, CheckCircle, AlertCircle, Clock, Eye, EyeOff } from "lucide-react";

interface FlashCardProps {
  point: KnowledgePoint;
  chapterTitle: string;
  status: CardStatus;
  cardIndex: number;
  totalCards: number;
  reviewMode?: ReviewMode;
  globalHidden?: boolean;
  cardHidden?: boolean;
  onToggleAnswer?: () => void;
}

const statusConfig: Record<CardStatus, { icon: React.ReactNode; color: string; label: string }> = {
  unlearned: { icon: <BookOpen className="w-5 h-5" />, color: "text-blue-500", label: "未学" },
  learning: { icon: <Clock className="w-5 h-5" />, color: "text-yellow-500", label: "学习中" },
  mastered: { icon: <CheckCircle className="w-5 h-5" />, color: "text-green-500", label: "已掌握" },
  needs_review: { icon: <AlertCircle className="w-5 h-5" />, color: "text-red-500", label: "需复习" },
};

const typeLabels: Record<string, string> = {
  definition: "定义",
  list: "列表",
  comparison: "对比",
  formula: "公式",
  process: "流程",
  example: "案例",
  qa: "简答",
  mcq: "选择题",
  fill: "填空题",
  judge: "判断题",
};

// 清理内容中泄露的答案行
function cleanContent(content: string): string {
  return content
    .replace(/正确答案[：:].*/g, "")
    .replace(/答案[：:].*/g, "")
    .replace(/正确选项[：:].*/g, "")
    .trim();
}

export default function FlashCard({
  point,
  chapterTitle,
  status,
  cardIndex,
  totalCards,
  reviewMode = "recite",
  globalHidden = false,
  cardHidden = false,
  onToggleAnswer,
}: FlashCardProps) {
  const config = statusConfig[status];
  const isQuizType = point.type === "mcq" || point.type === "fill" || point.type === "judge";
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  // 实际隐藏状态：全局隐藏 XOR 单卡切换
  const answerHidden = globalHidden !== cardHidden;

  const displayContent = cleanContent(point.content);
  const correctLetter = point.correctAnswer?.trim().toUpperCase() || "";

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            {typeLabels[point.type] || point.type}
          </span>
          <span className="text-sm text-gray-500">{chapterTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>

      {/* 进度指示 */}
      <div className="text-xs text-gray-400 mb-3">
        {cardIndex + 1} / {totalCards}
      </div>

      {/* 知识点标题 */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">{point.title}</h2>

      {/* 原始题目（如果是题型卡片） */}
      {isQuizType && point.originalQuestion && (
        <div className="bg-yellow-50 rounded-xl p-4 mb-4 border border-yellow-100">
          <p className="text-gray-700 leading-relaxed font-medium">{point.originalQuestion}</p>
        </div>
      )}

      {/* ===== 选择题 ===== */}
      {point.type === "mcq" && point.options && point.options.length > 0 && (
        <>
          {reviewMode === "recite" ? (
            /* 背诵模式：直接显示选项 + 正确答案标绿 */
            <div className="space-y-2 mb-4">
              {point.options.map((opt, i) => {
                const letter = opt.charAt(0).toUpperCase();
                const isCorrect = letter === correctLetter;
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-3 rounded-lg border ${
                      isCorrect
                        ? "border-green-400 bg-green-50"
                        : "border-gray-200 bg-gray-50 opacity-60"
                    }`}
                  >
                    <span className={`font-medium flex-shrink-0 ${isCorrect ? "text-green-600" : "text-gray-500"}`}>
                      {letter}.
                    </span>
                    <span className={isCorrect ? "text-green-700 font-medium" : "text-gray-600"}>
                      {opt.slice(3)}
                    </span>
                    {isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-500 ml-auto flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* 刷题模式：可点击选项 */
            <div className="space-y-2 mb-4">
              {point.options.map((opt, i) => {
                const letter = opt.charAt(0).toUpperCase();
                const isSelected = selectedIdx === i;
                const isCorrect = letter === correctLetter;
                const showResult = selectedIdx !== null;

                let borderColor = "border-gray-200";
                let bgColor = "hover:border-blue-300 hover:bg-blue-50";
                if (showResult) {
                  if (isCorrect) {
                    borderColor = "border-green-400";
                    bgColor = "bg-green-50";
                  } else if (isSelected && !isCorrect) {
                    borderColor = "border-red-400";
                    bgColor = "bg-red-50";
                  } else {
                    bgColor = "opacity-50";
                  }
                }

                return (
                  <button
                    key={i}
                    disabled={selectedIdx !== null}
                    onClick={() => setSelectedIdx(i)}
                    className={`w-full flex items-start gap-2 p-3 rounded-lg border ${borderColor} ${bgColor} transition-all text-left disabled:cursor-not-allowed`}
                  >
                    <span className="text-gray-500 font-medium flex-shrink-0">{letter}.</span>
                    <span className="text-gray-700">{opt.slice(3)}</span>
                    {showResult && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-500 ml-auto flex-shrink-0 mt-0.5" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <AlertCircle className="w-5 h-5 text-red-500 ml-auto flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 选择题解析 — 刷题模式选完后显示 */}
          {reviewMode === "quiz" && selectedIdx !== null && point.explanation && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-1">解析</p>
              <p className="text-gray-700 leading-relaxed text-sm">{point.explanation}</p>
            </div>
          )}
        </>
      )}

      {/* ===== 其他题型内容（填空/判断/简答等） ===== */}
      {point.type !== "mcq" && (
        <div className="bg-blue-50 rounded-xl p-4 mb-4 relative">
          {onToggleAnswer && (
            <button
              onClick={onToggleAnswer}
              className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-blue-100 transition-colors z-10"
              title={answerHidden ? "显示答案" : "隐藏答案"}
            >
              {answerHidden ? (
                <Eye className="w-4 h-4 text-blue-500" />
              ) : (
                <EyeOff className="w-4 h-4 text-blue-400" />
              )}
            </button>
          )}
          {answerHidden ? (
            <p className="text-gray-400 leading-relaxed text-sm italic">点击右上角图标查看答案</p>
          ) : (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{displayContent}</p>
          )}
        </div>
      )}

      {/* 填空题提示 */}
      {point.type === "fill" && (
        <div className="bg-amber-50 rounded-xl p-3 mb-4 border border-amber-100 text-sm text-amber-700">
          填空题 — 请在心中默念答案，然后复述
        </div>
      )}

      {/* 判断题提示 */}
      {point.type === "judge" && (
        <div className="bg-purple-50 rounded-xl p-3 mb-4 border border-purple-100 text-sm text-purple-700">
          判断题 — 请判断对错并说明理由
        </div>
      )}

      {/* 关键词 */}
      {point.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {point.keywords.map((kw, i) => (
            <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
