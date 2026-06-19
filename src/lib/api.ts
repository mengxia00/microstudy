"use client";

import { loadSettings } from "./settings";

// 带上 API 设置的 fetch 封装
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const settings = loadSettings();

  const headers = new Headers(options.headers);
  if (settings.apiKey) {
    headers.set("x-api-key", settings.apiKey);
  }
  if (settings.baseUrl) {
    headers.set("x-api-base", settings.baseUrl);
  }
  if (settings.model) {
    headers.set("x-api-model", settings.model);
  }

  return fetch(url, { ...options, headers });
}
