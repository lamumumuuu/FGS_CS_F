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
import AuthGuard from "@/components/AuthGuard";
import { siteConfig } from "@/siteConfig";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { ToastProvider } from "@/contexts/ToastContext";
import PermissionAutoRefresh from "@/components/PermissionAutoRefresh";
import { PageTransitionProvider } from "@/components/PageTransition";

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
          <ToastProvider>
            <PermissionAutoRefresh />
            {/*
              PageTransitionProvider 分为两个区域：
              1. stable（稳定区域）：如Navbar，不参与任何滑动动画，始终保持可见
              2. children（滑动区域）：页面主体内容，参与滑动过渡动画
              这样确保导航栏在页面切换时始终可见且位置不变
            */}
            <PageTransitionProvider stable={<Navbar />}>
              {/* 页面级加载动画包裹层：仅包裹页面内容，导航栏在stable区域 */}
              <AuthGuard>
                {children}            {/* 页面主体内容 */}
              </AuthGuard>
            </PageTransitionProvider>
          </ToastProvider>
        </PermissionProvider>
      </body>
    </html>
  );
}