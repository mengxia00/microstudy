"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import ModeSelector from "@/components/ModeSelector";
import Settings from "@/components/Settings";
import { StudyMode, CourseData } from "@/types";
import {
  createLearningState,
  saveState,
  loadProjects,
  addProject,
  deleteProject,
  renameProject,
  ProjectItem,
  getProgress,
} from "@/lib/stateManager";
import { apiFetch } from "@/lib/api";
import { BookOpen, Zap, Trash2, Play, FolderOpen, Pencil, Check, X, AlertTriangle } from "lucide-react";

const modeLabels: Record<StudyMode, string> = {
  exam_cram: "考前速成",
  normal: "正常复习",
  key_only: "只背重点",
  random: "抽题模式",
};

export default function HomePage() {
  const router = useRouter();
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<StudyMode>("normal");
  const [examDate, setExamDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

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
      const state = createLearningState(courseData, mode);
      saveState(state);

      // 保存课程数据（按项目ID存储）
      localStorage.setItem(`microstudy_course_${state.courseId}`, JSON.stringify(courseData));

      // 添加到项目列表
      addProject(state);
      setProjects(loadProjects());

      // 跳转到复习页
      router.push("/study");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "出错了，请重试";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueProject = (project: ProjectItem) => {
    // 加载该项目的状态和课程数据
    const stateRaw = localStorage.getItem(`microstudy_state_${project.id}`);
    const courseRaw = localStorage.getItem(`microstudy_course_${project.id}`);
    if (stateRaw && courseRaw) {
      localStorage.setItem("microstudy_state", stateRaw);
      localStorage.setItem("microstudy_course", courseRaw);
      router.push("/study");
    } else {
      alert("项目数据丢失，请重新上传");
    }
  };

  const handleStartRename = (project: ProjectItem) => {
    setRenamingId(project.id);
    setRenameValue(project.title);
  };

  const handleConfirmRename = () => {
    if (renamingId && renameValue.trim()) {
      renameProject(renamingId, renameValue.trim());
      setProjects(loadProjects());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const handleDeleteProject = (projectId: string) => {
    if (!confirm("确定删除这个项目吗？")) return;
    deleteProject(projectId);
    setProjects(loadProjects());
  };

  const handleWrongPractice = (project: ProjectItem) => {
    // 加载该项目的状态和课程数据
    const stateRaw = localStorage.getItem(`microstudy_state_${project.id}`);
    const courseRaw = localStorage.getItem(`microstudy_course_${project.id}`);
    if (stateRaw && courseRaw) {
      localStorage.setItem("microstudy_state", stateRaw);
      localStorage.setItem("microstudy_course", courseRaw);
      router.push("/study?wrong=true");
    } else {
      alert("项目数据丢失，请重新上传");
    }
  };

  const projectsWithWrong = projects.filter((p) => (p.wrongCount || 0) > 0);

  return (
    <main className="flex-1 p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8 pt-4">
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

        {/* 知识库 */}
        {projects.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-700">知识库</h2>
              <span className="text-sm text-gray-400">({projects.length})</span>
            </div>

            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
                >
                  {/* 信息区 */}
                  <div className="flex-1 min-w-0">
                    {renamingId === project.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleConfirmRename();
                            if (e.key === "Escape") handleCancelRename();
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={handleConfirmRename} className="p-1 text-green-500 hover:text-green-600">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleCancelRename} className="p-1 text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-medium text-gray-800 truncate">
                          {project.title}
                        </h3>
                        <button
                          onClick={() => handleStartRename(project)}
                          className="p-0.5 text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{modeLabels[project.mode]}</span>
                      <span>
                        {project.masteredCards}/{project.totalCards} 已掌握
                      </span>
                    </div>
                    {/* 进度条 */}
                    <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${project.totalCards > 0 ? (project.masteredCards / project.totalCards) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleContinueProject(project)}
                      className="p-2.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 错题库 */}
        {projectsWithWrong.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-700">错题库</h2>
              <span className="text-sm text-gray-400">
                ({projectsWithWrong.reduce((sum, p) => sum + (p.wrongCount || 0), 0)} 题)
              </span>
            </div>

            <div className="space-y-3">
              {projectsWithWrong.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-orange-100 shadow-sm p-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="text-orange-500 font-medium">
                        {project.wrongCount} 题待复习
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleWrongPractice(project)}
                    className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors flex-shrink-0"
                  >
                    重刷错题
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
