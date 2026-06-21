"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileText } from "lucide-react";
import mammoth from "mammoth";

interface FileUploadProps {
  onFileContent: (content: string, fileName: string) => void;
}

export default function FileUpload({ onFileContent }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();

      setParsing(true);
      try {
        let content = "";

        if (ext === ".docx") {
          // Word 文档解析
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          content = result.value;
        } else if (ext === ".md" || ext === ".txt") {
          // 纯文本直接读取
          content = await file.text();
        } else {
          alert("支持的格式：.md / .txt / .docx");
          return;
        }

        if (content && content.trim().length > 0) {
          setFileName(file.name);
          onFileContent(content, file.name);
        } else {
          alert("文件内容为空，请检查文件");
        }
      } catch (err) {
        console.error("File parse error:", err);
        alert("文件解析失败，请检查文件格式");
      } finally {
        setParsing(false);
      }
    },
    [onFileContent]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.docx"
        onChange={handleChange}
        className="hidden"
      />

      {parsing ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg font-medium text-gray-700">解析中...</p>
        </div>
      ) : fileName ? (
        <div className="flex flex-col items-center gap-3">
          <FileText className="w-12 h-12 text-green-500" />
          <p className="text-lg font-medium text-gray-700">{fileName}</p>
          <p className="text-sm text-gray-500">点击重新选择文件</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload className="w-12 h-12 text-gray-400" />
          <p className="text-lg font-medium text-gray-700">
            拖拽或点击上传学习资料
          </p>
          <p className="text-sm text-gray-500">支持 .md / .txt / .docx 格式</p>
        </div>
      )}
    </div>
  );
}
