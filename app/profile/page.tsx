// app/profile/page.tsx

/**
 * 个人中心页面
 * 
 * 展示当前登录用户的基本信息（头像、用户名、所属峰、角色、状态），
 * 以及两个功能 Tab（我的征途、我发布的悬赏），当前均为施工中占位。
 * 未登录时自动跳转到登录页。
 * 采用米白色系设计风格，与整体 UI 保持一致。
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePermission } from "@/contexts/PermissionContext";

/** 可切换的标签页类型 */
type TabType = "journey" | "published";

// 角色代码 → 中文显示名映射
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  sect_master: "宗主",
  grand_elder: "大长老",
  supreme_elder: "太上长老",
  honorary_elder: "荣誉长老",
  elder: "长老",
  inner_disciple: "内门弟子",
  outer_disciple: "外门弟子",
};

// 峰ID → 峰名称映射
const PEAK_NAMES: Record<number, string> = {
  1: "项目峰",
  2: "算法峰",
  3: "电路峰",
  4: "管理台",
};

/* ------------------------------------------------------------------ */
/*  页面组件                                                           */
/* ------------------------------------------------------------------ */
export default function Profile() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    loading,
    roleNames,
    peakIds,
    isGlobal,
  } = usePermission();

  const [activeTab, setActiveTab] = useState<TabType>("journey");

  /* ---------- 未登录自动跳转 ---------- */
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  /* ---------- 加载中 ---------- */
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F5F3F0" }}
      >
        <div className="text-gray-500 text-lg">加载中...</div>
      </div>
    );
  }

  /* ---------- 未登录不渲染（useEffect 会跳转） ---------- */
  if (!isAuthenticated || !user) {
    return null;
  }

  /* ---------- 计算展示用数据 ---------- */

  /** 所属峰中文名（取第一个峰） */
  const getPeakDisplayName = (): string => {
    if (!peakIds || peakIds.length === 0) return "无";
    const firstPeakId = peakIds[0];
    return PEAK_NAMES[firstPeakId] || `峰 ${firstPeakId}`;
  };

  /** 角色列表（逗号拼接） */
  const roleList = roleNames?.map((r) => ROLE_DISPLAY_NAMES[r] || r).join(", ") || "外门弟子";

  /* ---------- 临时数据（待后端扩展） ---------- */
  const lingshi = 0; // 当前后端未返回，占位

  /* ------------------------------------------------------------------ */
  /*  已登录主视图                                                     */
  /* ------------------------------------------------------------------ */
  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: "#F5F3F0" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* ---------- 返回首页 ---------- */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium mb-6 transition-colors"
        >
          <span>←</span>
          <span>返回首页</span>
        </Link>

        {/* ---------- 用户信息卡片：方角、实线边框 ---------- */}
        <div
          className="rounded-none shadow-md border border-gray-300 p-8 mb-6"
          style={{ backgroundColor: "#FAF9F7" }}
        >
          {/* 使用 flex 让左右两侧等高 */}
          <div className="flex items-stretch gap-6">
            {/* 左侧：头像 + 用户信息 */}
            <div className="flex items-center gap-6 flex-1">
              {/* 头像：圆形，支持自定义图片 */}
              <div className="w-28 h-28 rounded-full overflow-hidden flex-shrink-0 shadow-sm border border-gray-300 bg-gray-100 flex items-center justify-center">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.username}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl font-bold text-gray-400">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* 用户信息 */}
              <div className="flex flex-col">
                {/* 用户名 + 所属峰 */}
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-800">
                    {user.username}
                  </h1>
                  <span className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-none text-sm font-medium">
                    {getPeakDisplayName()}
                  </span>
                </div>

                {/* 用户名下方：显示角色 + 全局标签 */}
                <div className="mt-1 text-gray-600">
                  <span className="font-medium">角色：</span>
                  {roleList}
                  {isGlobal && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 border border-amber-300">
                      全局
                    </span>
                  )}
                </div>

                {/* 注册时间 */}
                <div className="mt-1 text-sm text-gray-500">
                  注册时间：{user.createTime ?? "未知"}
                </div>
              </div>
            </div>

            {/* 右侧：灵石数量（正方形） */}
            <div className="flex-shrink-0 w-28 h-28 bg-amber-50 border-2 border-amber-200 flex flex-col items-center justify-center">
              <span className="text-2xl">💎</span>
              <span className="text-2xl font-bold text-amber-700">
                {lingshi}
              </span>
            </div>
          </div>
        </div>

        {/* ---------- Tab 区域 ---------- */}
        <div
          className="rounded-none shadow-md border border-gray-300 overflow-hidden"
          style={{ backgroundColor: "#FAF9F7" }}
        >
          {/* Tab 栏 */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("journey")}
              className={`flex-1 px-6 py-4 font-medium text-center transition-colors ${
                activeTab === "journey"
                  ? "text-gray-900 border-b-2 border-gray-800 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              🗺️ 我的征途
            </button>
            <button
              onClick={() => setActiveTab("published")}
              className={`flex-1 px-6 py-4 font-medium text-center transition-colors ${
                activeTab === "published"
                  ? "text-gray-900 border-b-2 border-gray-800 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              📜 我发布的悬赏
            </button>
          </div>

          {/* Tab 内容：施工中占位 */}
          <div className="p-12">
            <div className="text-center">
              <div className="text-5xl mb-4">🏗️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">施工中</h3>
              <p className="text-gray-500">
                {activeTab === "journey"
                  ? "我的征途功能正在建设中..."
                  : "悬赏发布功能正在建设中..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}