"use client";

import { useState, useEffect } from "react";
import { User } from "@/types/user";
import { getCurrentUser } from "@/services/userService";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex-1 flex items-center justify-center bg-amber-50/30">
        <div className="text-amber-600 text-lg">加载中...</div>
      </div>
    );
  }

  const isLoggedIn = user?.isLoggedIn;

  return (
    <div className="flex-1 bg-amber-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {isLoggedIn && user && (
          <Link
            href="/profile"
            className="block bg-white rounded-2xl shadow-lg border border-amber-100 p-6 hover:shadow-xl hover:border-amber-200 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {user.username.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{user.username}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    加入日期：{user.joinDate}
                  </p>
                </div>
              </div>
              {user.role && (
                <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-medium text-sm">
                  {user.role}
                </div>
              )}
            </div>
            <div className="flex items-end justify-between pt-4 border-t border-amber-50">
              <div className="text-sm text-gray-500">
                所属峰：
                <span className="font-medium text-amber-700">
                  {user.peak ?? "外门弟子"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-amber-600">
                <span className="text-xl">💎</span>
                <span className="font-bold text-xl">{user.lingshi}</span>
                <span className="text-sm">灵石</span>
              </div>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/task-hall"
            className="group bg-white rounded-2xl shadow-lg border border-amber-100 p-8 hover:shadow-xl hover:border-amber-300 hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-4xl shadow-md group-hover:scale-110 transition-transform">
                ⚔️
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">任务大厅</h2>
              <p className="text-gray-600 leading-relaxed">
                浏览悬赏令，接受各种委托任务，积累灵石与声望，成为传奇勇者
              </p>
              <div className="mt-5 inline-flex items-center gap-1 text-amber-600 font-medium group-hover:gap-2 transition-all">
                <span>进入大厅</span>
                <span>→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/sect-affairs"
            className="group bg-white rounded-2xl shadow-lg border border-amber-100 p-8 hover:shadow-xl hover:border-amber-300 hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center text-4xl shadow-md group-hover:scale-110 transition-transform">
                🏛️
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">宗门事务</h2>
              <p className="text-gray-600 leading-relaxed">
                管理宗门弟子名册，查看各峰实力分布，处理宗门日常事务
              </p>
              <div className="mt-5 inline-flex items-center gap-1 text-purple-600 font-medium group-hover:gap-2 transition-all">
                <span>进入宗门</span>
                <span>→</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
