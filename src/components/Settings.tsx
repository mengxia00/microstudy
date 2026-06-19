"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Eye, EyeOff, RefreshCw } from "lucide-react";
import { loadSettings, saveSettings, ApiSettings } from "@/lib/settings";
import { apiFetch } from "@/lib/api";

interface SettingsProps {
  onSaved?: () => void;
}

export default function Settings({ onSaved }: SettingsProps) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // 模型列表
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSettings();
    setApiKey(s.apiKey);
    setBaseUrl(s.baseUrl);
    setModel(s.model);
  }, []);

  const handleSave = () => {
    const settings: ApiSettings = {
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || "https://api.openai.com/v1",
      model: model.trim() || "gpt-4o-mini",
    };
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved?.();
  };

  // 获取模型列表
  const handleFetchModels = async () => {
    // 先保存当前设置
    handleSave();

    setLoadingModels(true);
    setModelsError(null);
    setModels([]);

    try {
      const res = await apiFetch("/api/models");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "获取失败");
      }

      setModels(data.models || []);
      if (data.models?.length === 0) {
        setModelsError("没有找到可用模型");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "获取模型列表失败";
      setModelsError(message);
    } finally {
      setLoadingModels(false);
    }
  };

  const hasKey = apiKey.trim().length > 0;

  return (
    <div>
      {/* 设置按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          hasKey
            ? "border-green-300 bg-green-50 text-green-700"
            : "border-red-300 bg-red-50 text-red-700"
        }`}
      >
        <SettingsIcon className="w-4 h-4" />
        {hasKey ? "API 已配置" : "配置 API Key"}
      </button>

      {/* 设置面板 */}
      {open && (
        <div className="mt-3 p-4 bg-white rounded-xl border border-gray-200 space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API 地址（中转站）
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模型
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o-mini"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleFetchModels}
                disabled={!apiKey.trim() || loadingModels}
                className="px-3 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 ${loadingModels ? "animate-spin" : ""}`} />
                获取模型
              </button>
            </div>

            {/* 模型列表 */}
            {modelsError && (
              <p className="text-sm text-red-500 mt-1">{modelsError}</p>
            )}
            {models.length > 0 && (
              <div className="mt-2 max-h-40 overflow-auto border border-gray-200 rounded-lg">
                {models.map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                      model === m ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            className="w-full py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            {saved ? "已保存" : "保存设置"}
          </button>

          <p className="text-xs text-gray-400">
            设置保存在浏览器本地，不会上传到服务器。
          </p>
        </div>
      )}
    </div>
  );
}
