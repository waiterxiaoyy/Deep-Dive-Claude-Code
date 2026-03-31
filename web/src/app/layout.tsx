import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deep Dive Claude Code",
  description: "从源码理解生产级 AI 编程助手 — 13 章由浅入深",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
