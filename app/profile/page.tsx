"use client";

import { useState, useEffect } from "react";
import { User } from "@/types/user";
import { getCurrentUser } from "@/services/userService";
import Link from "next/link";

type TabType = "journey" | "published";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("journey");

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
        <div className="text-amber-600 text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900 font-medium mb-6 transition-colors"
        >
          <span>←</span>
          <span>返回首页</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-28 h-28 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white text-5xl font-bold flex-shrink-0 shadow-lg">
              {user?.username.charAt(0) ?? "?"}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    {user?.username}
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                      {user?.title ?? "无称号"}
                    </span>
                  </h1>
                  <div className="mt-2 text-gray-600">
                    <span className="font-medium">{user?.role ?? "外门弟子"}</span>
                    {user?.peak && (
                      <span className="text-gray-400 mx-2">·</span>
                    )}
                    {user?.peak && <span>{user.peak}</span>}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    学号：{user?.studentId ?? "未绑定"}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">灵石</div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <span className="text-2xl">💎</span>
                    <span className="text-3xl font-bold">{user?.lingshi ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
          <div className="flex border-b border-amber-50">
            <button
              onClick={() => setActiveTab("journey")}
              className={`flex-1 px-6 py-4 font-medium text-center transition-colors ${
                activeTab === "journey"
                  ? "text-amber-700 border-b-2 border-amber-500 bg-amber-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              🗺️ 我的征途
            </button>
            <button
              onClick={() => setActiveTab("published")}
              className={`flex-1 px-6 py-4 font-medium text-center transition-colors ${
                activeTab === "published"
                  ? "text-amber-700 border-b-2 border-amber-500 bg-amber-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              📜 我发布的悬赏
            </button>
          </div>

          <div className="p-12">
            <div className="text-center">
              <div className="text-5xl mb-4">🏗️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">施工中</h3>
              <p className="text-gray-500">
                {activeTab === "journey" ? "我的征途功能正在建设中..." : "悬赏发布功能正在建设中..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
