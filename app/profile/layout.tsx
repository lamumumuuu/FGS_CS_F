// app/profile/layout.tsx

/**
 * 个人中心专属布局
 * 
 * 与根布局类似但更精简，不包含 Navbar 和 PermissionProvider，
 * 仅提供字体变量和基础 HTML 结构。
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
  title: `个人中心 - ${siteConfig.name}`,
  description: "个人中心",
};

/* ------------------------------------------------------------------ */
/*  布局组件                                                         */
/* ------------------------------------------------------------------ */
export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <div className="min-h-full flex flex-col">{children}</div>
    </div>
  );
}