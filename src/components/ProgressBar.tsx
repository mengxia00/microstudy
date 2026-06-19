"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  mastered?: number;
  learning?: number;
  needsReview?: number;
}

export default function ProgressBar({
  current,
  total,
  mastered = 0,
  learning = 0,
  needsReview = 0,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const masteredPercent = total > 0 ? (mastered / total) * 100 : 0;
  const learningPercent = total > 0 ? (learning / total) * 100 : 0;
  const reviewPercent = total > 0 ? (needsReview / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">
          进度 {current} / {total}
        </span>
        <span className="text-sm font-bold text-blue-600">{percentage}%</span>
      </div>

      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full flex">
          {masteredPercent > 0 && (
            <div
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${masteredPercent}%` }}
            />
          )}
          {learningPercent > 0 && (
            <div
              className="bg-yellow-500 transition-all duration-300"
              style={{ width: `${learningPercent}%` }}
            />
          )}
          {reviewPercent > 0 && (
            <div
              className="bg-red-500 transition-all duration-300"
              style={{ width: `${reviewPercent}%` }}
            />
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          已掌握 {mastered}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          学习中 {learning}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          需复习 {needsReview}
        </span>
      </div>
    </div>
  );
}
