// components/Navbar.tsx

/**
 * 顶部导航栏组件
 * 
 * 应用全局导航，包含 Logo、菜单、用户信息/登录入口。
 * 采用米白色背景设计，用户下拉菜单与认证卡片风格统一（虚线边框、米白背景）。
 * 登录/注册页面通过独立 layout 不渲染此组件。
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { siteConfig, navMenuItems } from "@/siteConfig";
import { useState, useEffect, useRef } from "react";
import { usePermission } from "@/contexts/PermissionContext";


/* ------------------------------------------------------------------ */
/*  组件定义                                                           */
/* ------------------------------------------------------------------ */
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = usePermission();

  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);



  /* ---------- 点击外部关闭下拉菜单 ---------- */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAvatarDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  /* ------------------------------------------------------------------ */
  /*  事件处理                                                          */
  /* ------------------------------------------------------------------ */

  function handleMouseEnter() {
    setShowAvatarDropdown(true);
  }

  function handleMouseLeave() {
    setShowAvatarDropdown(false);
  }

  async function handleLogout() {
    try {
      await logout();
      setShowAvatarDropdown(false);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  渲染                                                              */
  /* ------------------------------------------------------------------ */
  return (
    /* ---------- 导航栏主体：米白色背景 ---------- */
    <nav
      className="px-6 py-4 shadow-sm border-b border-gray-200"
      style={{ backgroundColor: "#F5F3F0" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* ---------- Logo 区域 ---------- */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-300">
              <Image
                src="/logo.png"
                alt={siteConfig.name}
                width={40}
                height={40}
    className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl font-bold text-gray-800">{siteConfig.name}</span>
          </Link>
        </div>

        {/* ---------- 导航菜单 ---------- */}
        <div className="flex items-center gap-8">
          {navMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-base font-medium transition-colors hover:text-gray-900 ${
                pathname === item.href
                  ? "text-gray-900 border-b-2 border-gray-800 pb-1"
                  : "text-gray-600"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

{/* ---------- 用户区域 ---------- */}
<div className="flex items-center gap-4">
  {/* 已登录：显示灵石和头像 */}
  {isAuthenticated && user ? (
    <div
      ref={dropdownRef}
      className="relative"
    >
      {/* 头像按钮：点击切换下拉菜单 */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-gray-400 bg-gray-100">
          <span className="text-lg">👤</span>
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {user.username}
        </span>
      </div>

      {/* ---------- 下拉菜单：与认证卡片统一风格 ---------- */}
      {showAvatarDropdown && (
        <div
          className="absolute right-0 top-12 z-50 w-72 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            backgroundColor: "#F5F3F0",
            border: "1px dashed #333",
            borderRadius: "0px",
          }}
        >
          {/* 用户信息头部 */}
          <div className="p-4 border-b border-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl flex-shrink-0 border border-gray-300">
                👤
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg truncate text-gray-800">
                  {user.username}
                </div>
                <div className="text-gray-500 text-sm">
                  ID: {user.id}
                </div>
              </div>
            </div>
          </div>

          {/* 菜单项 */}
          <div className="p-2">
            <Link
              href="/profile"
              className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-white hover:text-gray-900 flex items-center gap-2 transition-colors"
              onClick={() => setShowAvatarDropdown(false)}
            >
              <span>👤</span>
              <span>个人中心</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors"
            >
              <span>🚪</span>
              <span>退出登录</span>
            </button>
          </div>
        </div>
      )}
    </div>
  ) : (
    /* ---------- 未登录：登录/注册按钮 ---------- */
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="px-4 py-2 text-gray-700 font-medium rounded-none border border-transparent hover:bg-white hover:border-gray-400 transition-colors"
        style={{ backgroundColor: "transparent" }}
      >
        登录
      </Link>
      <Link
        href="/register"
        className="px-4 py-2 bg-gray-800 text-white font-medium rounded-none hover:bg-gray-900 transition-colors"
      >
        注册
      </Link>
    </div>
  )}
        </div>
        
      </div>
    </nav>
  );
}
