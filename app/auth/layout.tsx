// app/auth/layout.tsx

/**
 * 认证页专属布局
 * 
 * 提供字体变量和基础 HTML 结构，不包含 Navbar 和 PermissionProvider，
 * 保持认证流程简洁独立。
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { siteConfig } from "@/siteConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `认证 - ${siteConfig.name}`,
  description: "用户登录与注册",
};

export default function AuthLayout({
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