"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Eye, EyeOff } from "lucide-react";
import { loadSettings, saveSettings, ApiSettings } from "@/lib/settings";

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
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
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
