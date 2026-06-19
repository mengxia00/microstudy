"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import ModeSelector from "@/components/ModeSelector";
import Settings from "@/components/Settings";
import { StudyMode, CourseData } from "@/types";
import { createLearningState, saveState } from "@/lib/stateManager";
import { apiFetch } from "@/lib/api";
import { BookOpen, Zap } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<StudyMode>("normal");
  const [examDate, setExamDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileContent = (content: string, name: string) => {
    setFileContent(content);
    setFileName(name);
    setError(null);
  };

  const handleStart = async () => {
    if (!fileContent) {
      setError("请先上传学习资料");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: fileContent,
          mode,
          examDate: examDate || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "解析失败");
      }

      const courseData: CourseData = await res.json();

      // 创建学习状态并保存
      const state = createLearningState(courseData, mode);
      saveState(state);

      // 保存课程数据到 localStorage
      localStorage.setItem("microstudy_course", JSON.stringify(courseData));

      // 跳转到复习页
      router.push("/study");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "出错了，请重试";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-10 h-10 text-blue-500" />
            <h1 className="text-4xl font-bold text-gray-800">MicroStudy</h1>
          </div>
          <p className="text-lg text-gray-500">一次只学一点</p>
        </div>

        {/* 主卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 space-y-6">
          {/* API 设置 */}
          <Settings />

          {/* 文件上传 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">上传学习资料</h2>
            <FileUpload onFileContent={handleFileContent} />
          </div>

          {/* 考试时间 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">考试时间（可选）</h2>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* 学习模式 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">学习模式</h2>
            <ModeSelector selected={mode} onChange={setMode} />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              {error}
            </div>
          )}

          {/* 开始按钮 */}
          <button
            onClick={handleStart}
            disabled={!fileContent || loading}
            className="w-full py-4 rounded-xl bg-blue-500 text-white font-semibold text-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                AI 正在解析...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                开始学习
              </>
            )}
          </button>
        </div>

        {/* 底部链接 */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              const course = localStorage.getItem("microstudy_course");
              if (course) {
                router.push("/study");
              } else {
                alert("没有找到学习记录，请先上传资料");
              }
            }}
            className="text-blue-500 hover:text-blue-600 underline"
          >
            继续上次学习
          </button>
        </div>
      </div>
    </main>
  );
}
