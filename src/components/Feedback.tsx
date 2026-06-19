"use client";

import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface FeedbackProps {
  feedback: string;
  correct: boolean | null;
  loading?: boolean;
}

export default function Feedback({ feedback, correct, loading = false }: FeedbackProps) {
  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        <span className="text-gray-600">AI 思考中...</span>
      </div>
    );
  }

  if (!feedback) return null;

  return (
    <div
      className={`rounded-xl p-4 ${
        correct === true
          ? "bg-green-50 border border-green-200"
          : correct === false
          ? "bg-red-50 border border-red-200"
          : "bg-blue-50 border border-blue-200"
      }`}
    >
      <div className="flex items-start gap-3">
        {correct === true && <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />}
        {correct === false && <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />}
        <div>
          <p
            className={`leading-relaxed ${
              correct === true
                ? "text-green-800"
                : correct === false
                ? "text-red-800"
                : "text-blue-800"
            }`}
          >
            {feedback}
          </p>
        </div>
      </div>
    </div>
  );
}
