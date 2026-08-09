// app/profile/page.tsx

/**
 * 个人中心页面
 * 
 * 展示当前登录用户的基本信息（头像、用户名、所属峰、角色、状态），
 * 以及两个功能 Tab（我的征途、我发布的悬赏）。
 * 未登录时自动跳转到登录页。
 * 采用米白色系设计风格，与整体 UI 保持一致。
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePermission } from "@/contexts/PermissionContext";
import { useNavTransition } from "@/hooks/useNavTransition";
import { taskApi } from "@/app/api/client";
import { Task } from "@/types/task";
import { BackendUser } from "@/types/user";

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

// 难度显示配置
const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  "黑铁": { label: "黑铁", color: "text-gray-700", bg: "bg-gray-200" },
  "青铜": { label: "青铜", color: "text-amber-600", bg: "bg-amber-100" },
  "白银": { label: "白银", color: "text-slate-600", bg: "bg-slate-100" },
  "黄金": { label: "黄金", color: "text-yellow-600", bg: "bg-yellow-100" },
};

// 状态显示配置
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  "审核中": { label: "审核中", color: "text-blue-600", bg: "bg-blue-50" },
  "等待中": { label: "等待中", color: "text-green-600", bg: "bg-green-50" },
  "讨伐中": { label: "讨伐中", color: "text-orange-600", bg: "bg-orange-50" },
  "已完成": { label: "已完成", color: "text-gray-600", bg: "bg-gray-100" },
  "已驳回": { label: "已驳回", color: "text-red-600", bg: "bg-red-50" },
};

/* ------------------------------------------------------------------ */
/*  页面组件                                                           */
/* ------------------------------------------------------------------ */
export default function Profile() {
  const router = useRouter();
  const { navigate } = useNavTransition();
  const {
    user,
    isAuthenticated,
    loading,
    roleNames,
    peakIds,
    isGlobal,
    subscribeToUserData,
  } = usePermission();

  const [activeTab, setActiveTab] = useState<TabType>("journey");
  const [journeyTasks, setJourneyTasks] = useState<Task[]>([]);
  const [publishedTasks, setPublishedTasks] = useState<Task[]>([]);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [publishedLoading, setPublishedLoading] = useState(false);
  const [lingshi, setLingshi] = useState<number>(0);

  /* ---------- 未登录自动跳转 ---------- */
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [loading, isAuthenticated, navigate]);

  /* ---------- 订阅用户数据变更，实现灵石实时同步 ---------- */
  useEffect(() => {
    if (!isAuthenticated) return;
    // 从 context 中的 user 初始化灵石值
    if (user?.lingshi !== undefined && user?.lingshi !== null) {
      setLingshi(user.lingshi);
    }
    // 订阅用户数据变更（灵石变化时自动更新）
    const unsubscribe = subscribeToUserData((updatedUser) => {
      if (updatedUser?.lingshi !== undefined && updatedUser?.lingshi !== null) {
        setLingshi(updatedUser.lingshi);
      }
    });
    return unsubscribe;
  }, [isAuthenticated, user, subscribeToUserData]);

  /* ---------- 页面进入时自动刷新权限，确保角色信息最新 ---------- */
  useEffect(() => {
    if (isAuthenticated) {
      loadJourneyTasks();
      loadPublishedTasks();
    }
  }, [isAuthenticated]);

  /* ---------- 加载我的征途（已完成任务） ---------- */
  async function loadJourneyTasks() {
    setJourneyLoading(true);
    try {
      const tasks = await taskApi.getMyCompletedTasks();
      setJourneyTasks(tasks);
    } catch (error) {
      console.error("加载我的征途失败:", error);
    } finally {
      setJourneyLoading(false);
    }
  }

  /* ---------- 加载我发布的悬赏 ---------- */
  async function loadPublishedTasks() {
    setPublishedLoading(true);
    try {
      const tasks = await taskApi.getMyTasks();
      setPublishedTasks(tasks);
    } catch (error) {
      console.error("加载我发布的悬赏失败:", error);
    } finally {
      setPublishedLoading(false);
    }
  }

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

  /* ---------- 应用与首页一致的背景样式 ---------- */
  useEffect(() => {
    const originalBg = document.body.style.background;
    const originalBgColor = document.body.style.backgroundColor;
    const originalBgSize = document.body.style.backgroundSize;
    const originalBgRepeat = document.body.style.backgroundRepeat;
    const originalBgBlend = document.body.style.backgroundBlendMode;

    document.body.style.background = `url('/backg.jpg')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundRepeat = 'repeat';
    document.body.style.backgroundBlendMode = 'multiply';
    document.body.style.backgroundColor = '#f4f0e6';

    return () => {
      document.body.style.background = originalBg;
      document.body.style.backgroundColor = originalBgColor;
      document.body.style.backgroundSize = originalBgSize;
      document.body.style.backgroundRepeat = originalBgRepeat;
      document.body.style.backgroundBlendMode = originalBgBlend;
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /*  已登录主视图                                                     */
  /* ------------------------------------------------------------------ */
  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: "#f4f0e6" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* ---------- 返回首页 ---------- */}
        <Link
          href="/"
          onClick={(e) => { e.preventDefault(); navigate("/"); }}
          className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium mb-6 transition-colors"
        >
          <span>←</span>
          <span>返回首页</span>
        </Link>

        {/* ---------- 用户信息卡片：圆角、半透明边框 ---------- */}
        <div
          className="rounded-2xl shadow-md border border-gray-300/50 p-8 mb-6 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(250, 249, 247, 0.92)" }}
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
          className="rounded-2xl shadow-md border border-gray-300/50 overflow-hidden backdrop-blur-sm"
          style={{ backgroundColor: "rgba(250, 249, 247, 0.92)" }}
        >
          {/* Tab 栏 */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab("journey");
                loadJourneyTasks();
              }}
              className={`flex-1 px-6 py-4 font-medium text-center transition-colors ${activeTab === "journey"
                ? "text-gray-900 border-b-2 border-gray-800 bg-white"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              🗺️ 我的征途
            </button>
            <button
              onClick={() => {
                setActiveTab("published");
                loadPublishedTasks();
              }}
              className={`flex-1 px-6 py-4 font-medium text-center transition-colors ${activeTab === "published"
                ? "text-gray-900 border-b-2 border-gray-800 bg-white"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              📜 我发布的悬赏
            </button>
          </div>

          {/* ---------- 我的征途内容 ---------- */}
          {activeTab === "journey" && (
            <div className="p-6">
              {journeyLoading ? (
                <div className="text-center py-12">
                  <div className="text-gray-500">加载中...</div>
                </div>
              ) : journeyTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🌱</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">暂无征途记录</h3>
                  <p className="text-gray-500">完成任务后，记录将显示在这里</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {journeyTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white/80 backdrop-blur-sm border border-gray-200 p-4 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-lg mb-2">{task.title}</h3>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-none ${DIFFICULTY_CONFIG[task.difficulty]?.bg} ${DIFFICULTY_CONFIG[task.difficulty]?.color}`}>
                              {DIFFICULTY_CONFIG[task.difficulty]?.label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-none ${STATUS_CONFIG[task.status]?.bg} ${STATUS_CONFIG[task.status]?.color}`}>
                              {STATUS_CONFIG[task.status]?.label}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="text-2xl font-bold text-amber-700">{task.reward}</div>
                          <div className="text-xs text-gray-500">灵石奖励</div>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        完成时间：{task.createdAt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------- 我发布的悬赏内容 ---------- */}
          {activeTab === "published" && (
            <div className="p-6">
              {publishedLoading ? (
                <div className="text-center py-12">
                  <div className="text-gray-500">加载中...</div>
                </div>
              ) : publishedTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📝</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">暂无发布记录</h3>
                  <p className="text-gray-500">发布任务后，记录将显示在这里</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publishedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white/80 backdrop-blur-sm border border-gray-200 p-4 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-lg mb-2">{task.title}</h3>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-none ${DIFFICULTY_CONFIG[task.difficulty]?.bg} ${DIFFICULTY_CONFIG[task.difficulty]?.color}`}>
                              {DIFFICULTY_CONFIG[task.difficulty]?.label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-none ${STATUS_CONFIG[task.status]?.bg} ${STATUS_CONFIG[task.status]?.color}`}>
                              {STATUS_CONFIG[task.status]?.label}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="text-2xl font-bold text-amber-700">{task.reward}</div>
                          <div className="text-xs text-gray-500">悬赏灵石</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-6 text-sm text-gray-500">
                        <span>发布时间：{task.createdAt}</span>
                        {task.deadline && (
                          <span>截止日期：{task.deadline}</span>
                        )}
                      </div>
                      {task.rejectReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-none">
                          驳回原因：{task.rejectReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}