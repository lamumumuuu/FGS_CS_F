// app/register/layout.tsx

/**
 * 注册页专属布局
 * 
 * 与根布局类似，但不包含 Navbar 和 PermissionProvider，
 * 保持注册流程简洁独立，仅提供字体和 HTML 结构。
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";                       /// 复用全局样式
import { siteConfig } from "@/siteConfig";

/* ------------------------------------------------------------------ */
/*  字体配置                                                         */
/* ------------------------------------------------------------------ */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* ------------------------------------------------------------------ */
/*  页面元数据                                                       */
/* ------------------------------------------------------------------ */
export const metadata: Metadata = {
  title: `注册 - ${siteConfig.name}`,
  description: "用户注册",
};

/* ------------------------------------------------------------------ */
/*  布局组件                                                         */
/* ------------------------------------------------------------------ */
export default function RegisterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}