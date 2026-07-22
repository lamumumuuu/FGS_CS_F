// app/layout.tsx

/**
 * 根布局组件
 * 
 * 整个应用的外层框架，设置 HTML 语言、字体变量、全局元数据，
 * 并包裹权限提供者和导航栏，所有页面作为 children 渲染在其中。
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { siteConfig } from "@/siteConfig";
import { PermissionProvider } from "@/contexts/PermissionContext";

/* ------------------------------------------------------------------ */
/*  字体配置：Geist Sans 和 Geist Mono，通过 CSS 变量引入           */
/* ------------------------------------------------------------------ */
const geistSans = Geist({
  variable: "--font-geist-sans",     /// 对应 globals.css 中的 --font-sans
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",     /// 对应 --font-mono
  subsets: ["latin"],
});

/* ------------------------------------------------------------------ */
/*  页面元数据：标题和描述来自 siteConfig                            */
/* ------------------------------------------------------------------ */
export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

/* ------------------------------------------------------------------ */
/*  根布局组件：所有页面共享的外壳                                 */
/* ------------------------------------------------------------------ */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}  /// 注入字体变量，满高，抗锯齿
    >
      <body className="min-h-full flex flex-col">
        {/* 权限上下文包裹整个应用，子组件可使用 usePermission() */}
        <PermissionProvider>
          <Navbar />               {/* 顶部导航栏 */}
          {children}               {/* 页面主体内容 */}
        </PermissionProvider>
      </body>
    </html>
  );
}