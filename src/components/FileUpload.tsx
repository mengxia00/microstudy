"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileText } from "lucide-react";

interface FileUploadProps {
  onFileContent: (content: string, fileName: string) => void;
}

export default function FileUpload({ onFileContent }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const validTypes = [".md", ".txt"];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();

      if (!validTypes.includes(ext)) {
        alert("目前只支持 .md 和 .txt 文件");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          setFileName(file.name);
          onFileContent(content, file.name);
        }
      };
      reader.readAsText(file);
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
        accept=".md,.txt"
        onChange={handleChange}
        className="hidden"
      />

      {fileName ? (
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
          <p className="text-sm text-gray-500">支持 .md / .txt 格式</p>
        </div>
      )}
    </div>
  );
}
