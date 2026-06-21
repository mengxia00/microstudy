"use client";

import { useState, useRef } from "react";
import { Send, Lightbulb, Minimize2, HelpCircle } from "lucide-react";

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  onHint: () => void;
  onSimplify: () => void;
  onAsk: (question: string) => void;
  disabled?: boolean;
}

export default function AnswerInput({
  onSubmit,
  onHint,
  onSimplify,
  onAsk,
  disabled = false,
}: AnswerInputProps) {
  const [answer, setAnswer] = useState("");
  const [showAsk, setShowAsk] = useState(false);
  const [question, setQuestion] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 不自动聚焦，避免手机端自动弹出键盘

  const handleSubmit = () => {
    if (answer.trim() && !disabled) {
      onSubmit(answer.trim());
      setAnswer("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAskSubmit = () => {
    if (question.trim()) {
      onAsk(question.trim());
      setQuestion("");
      setShowAsk(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* 输入框 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请复述这个知识点..."
          disabled={disabled}
          className="w-full p-4 pr-12 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={3}
        />
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || disabled}
          className="absolute right-3 bottom-3 p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* 功能按钮 */}
      <div className="flex gap-2">
        <button
          onClick={onHint}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <Lightbulb className="w-4 h-4" />
          提示
        </button>

        <button
          onClick={onSimplify}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <Minimize2 className="w-4 h-4" />
          太多了
        </button>

        <button
          onClick={() => setShowAsk(!showAsk)}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <HelpCircle className="w-4 h-4" />
          我想问
        </button>
      </div>

      {/* 提问输入框 */}
      {showAsk && (
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAskSubmit();
            }}
            placeholder="输入你的问题..."
            className="flex-1 px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleAskSubmit}
            disabled={!question.trim()}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
          >
            提问
          </button>
        </div>
      )}

      {/* 快捷键提示 */}
      <p className="text-xs text-gray-400">
        Enter 提交 · Ctrl+H 提示 · Ctrl+Q 提问
      </p>
    </div>
  );
}
