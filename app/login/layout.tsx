// app/login/layout.tsx

/**
 * 登录页专属布局
 * 
 * 与注册、个人中心布局结构一致，仅提供字体变量和基础 HTML 结构，
 * 不包含 Navbar 和 PermissionProvider，保持登录流程简洁。
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
  title: `登录 - ${siteConfig.name}`,
  description: "用户登录",
};

/* ------------------------------------------------------------------ */
/*  布局组件                                                         */
/* ------------------------------------------------------------------ */
export default function LoginLayout({
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