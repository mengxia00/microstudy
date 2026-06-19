import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MicroStudy — 一次只学一点",
  description: "适合 ADHD 用户的 AI 引导式微复习系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
