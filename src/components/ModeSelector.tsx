"use client";

import { StudyMode } from "@/types";

interface ModeSelectorProps {
  selected: StudyMode;
  onChange: (mode: StudyMode) => void;
}

const modes: { value: StudyMode; label: string; desc: string }[] = [
  { value: "exam_cram", label: "考前速成", desc: "只看高频考点，快速过一遍" },
  { value: "normal", label: "正常复习", desc: "全面复习，按重要性排序" },
  { value: "key_only", label: "只背重点", desc: "核心定义、公式、必考列表" },
  { value: "random", label: "抽题模式", desc: "随机抽查，检验理解程度" },
];

export default function ModeSelector({ selected, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onChange(mode.value)}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            selected === mode.value
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
          }`}
        >
          <p className="font-semibold text-gray-800">{mode.label}</p>
          <p className="text-sm text-gray-500 mt-1">{mode.desc}</p>
        </button>
      ))}
    </div>
  );
}
