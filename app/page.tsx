// app/page.tsx

/**
 * 首页
 * 
 * 应用首页，展示用户信息（已登录）或引导登录（未登录），
 * 以及任务大厅和宗门事务的入口卡片。
 * 采用米白水墨风格背景设计。
 * 
 * 数据来源：PermissionContext（基于后端 /api/user/me 接口）
 */

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePermission } from "@/contexts/PermissionContext";

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

// 峰ID → 峰名称映射（对应后端 /api/rbac/peaks 返回的数据）
// 注：如果后端返回的 peak 名称是中文，可以简化；如果是数字ID，需要映射。
// 这里根据常见约定硬编码，实际可从 peakIds 查询
const PEAK_NAMES: Record<number, string> = {
  1: "项目峰",
  2: "算法峰",
  3: "电路峰",
  4: "管理台",
};

/* ------------------------------------------------------------------ */
/*  页面组件                                                           */
/* ------------------------------------------------------------------ */
export default function Home() {
  const router = useRouter();
  const {
    isAuthenticated,
    user,
    roleNames,
    peakIds,
    isGlobal,
    loading,
  } = usePermission();

  /* ---------- 未认证卡片点击：跳转到登录页 ---------- */
  function handleUnauthenticatedClick() {
    router.push("/login");
  }

  /* ---------- 计算展示用的角色中文名 ---------- */
  const getRoleDisplayName = (): string => {
    if (!roleNames || roleNames.length === 0) return "外门弟子";
    // 取第一个角色，按优先级顺序匹配显示名
    for (const role of roleNames) {
      if (ROLE_DISPLAY_NAMES[role]) return ROLE_DISPLAY_NAMES[role];
    }
    return roleNames[0]; // 兜底显示原始代码
  };

  /* ---------- 计算展示用的所属峰 ---------- */
  const getPeakDisplayName = (): string => {
    if (!peakIds || peakIds.length === 0) return "无";
    // 如果有多个峰，取第一个显示；也可以用逗号拼接
    const firstPeakId = peakIds[0];
    return PEAK_NAMES[firstPeakId] || `峰 ${firstPeakId}`;
  };

  /* ---------- 灵石数量（暂时用占位，需后端支持） ---------- */
  // 注：当前 /api/user/me 不返回 lingshi 字段，此处临时使用 0
  // 待后端扩展字段后，改为 user.lingshi ?? 0
  const lingshi = 0;

  /* ------------------------------------------------------------------ */
  /*  渲染                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div
      className="flex-1 py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-72px)]"
      style={{
        backgroundColor: "#F5F3F0",
        backgroundImage: `
          radial-gradient(ellipse at top left, rgba(200, 180, 160, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(180, 160, 140, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 20% 80%, rgba(210, 190, 170, 0.06) 0%, transparent 30%)
        `,
      }}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ---------- 用户信息区域 ---------- */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 text-lg">加载中...</div>
          </div>
        ) : isAuthenticated && user ? (
          /* ---------- 已登录：用户信息卡片 ---------- */
          <Link
            href="/profile"
            className="block rounded-none shadow-md border border-gray-300 p-6 hover:shadow-lg hover:border-gray-400 transition-all"
            style={{ backgroundColor: "#FAF9F7" }}
          >
            <div className="flex items-stretch gap-6">
              {/* 左侧：头像 + 用户信息 */}
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl border border-gray-300 flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-gray-800">{user.username}</h2>
                  <p className="text-sm text-gray-600">
                    角色：{getRoleDisplayName()}
                    {isGlobal && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 border border-amber-300">
                        全局
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    所属峰：{getPeakDisplayName()}
                  </p>
                </div>
              </div>

              {/* 右侧：灵石数量（正方形） */}
              <div className="flex-shrink-0 w-20 h-20 bg-amber-50 border-2 border-amber-200 flex flex-col items-center justify-center">
                <span className="text-xl">💎</span>
                <span className="text-xl font-bold text-amber-700">
                  {lingshi}
                </span>
              </div>
            </div>

            {/* 底部：上次登录时间 */}
            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
              上次登录：
              <span className="font-medium text-gray-700">
                {user.lastLoginTime
                  ? new Date(user.lastLoginTime).toLocaleString()
                  : "首次登录"}
              </span>
            </div>
          </Link>
        ) : (
          /* ---------- 未登录：占位卡片，点击跳转登录 ---------- */
          <div
            onClick={handleUnauthenticatedClick}
            className="block rounded-none shadow-md border border-dashed border-gray-400 p-6 hover:shadow-lg hover:border-gray-600 transition-all cursor-pointer"
            style={{ backgroundColor: "#FAF9F7" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl border border-dashed border-gray-400">
                  👤
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-500">访客道友</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    登录后查看个人信息
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-none font-medium text-sm">
                未登录
              </div>
            </div>
            <div className="flex items-end justify-between pt-4 border-t border-dashed border-gray-300">
              <div className="text-sm text-gray-400">
                点击登录 / 注册，开启修仙之旅
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <span className="text-xl">💎</span>
                <span className="font-bold text-xl">--</span>
                <span className="text-sm">灵石</span>
              </div>
            </div>
          </div>
        )}

        {/* ---------- 功能入口卡片 ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ---------- 任务大厅 ---------- */}
          <Link
            href="/task-hall"
            className="group rounded-none shadow-md border border-gray-300 p-8 hover:shadow-xl hover:border-gray-500 hover:-translate-y-1 transition-all cursor-pointer"
            style={{ backgroundColor: "#FAF9F7" }}
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-5 bg-amber-100 rounded-none flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition-transform border border-amber-200">
                ⚔️
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">任务大厅</h2>
              <p className="text-gray-600 leading-relaxed">
                浏览悬赏令，接受各种委托任务，积累灵石与声望，成为传奇勇者
              </p>
              <div className="mt-5 inline-flex items-center gap-1 text-amber-700 font-medium group-hover:gap-2 transition-all">
                <span>进入大厅</span>
                <span>→</span>
              </div>
            </div>
          </Link>

          {/* ---------- 宗门事务 ---------- */}
          <Link
            href="/sect-affairs"
            className="group rounded-none shadow-md border border-gray-300 p-8 hover:shadow-xl hover:border-gray-500 hover:-translate-y-1 transition-all cursor-pointer"
            style={{ backgroundColor: "#FAF9F7" }}
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-5 bg-purple-100 rounded-none flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition-transform border border-purple-200">
                🏛️
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">宗门事务</h2>
              <p className="text-gray-600 leading-relaxed">
                管理宗门弟子名册，查看各峰实力分布，处理宗门日常事务
              </p>
              <div className="mt-5 inline-flex items-center gap-1 text-purple-700 font-medium group-hover:gap-2 transition-all">
                <span>进入宗门</span>
                <span>→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* ---------- 底部装饰：水墨风格 ---------- */}
        <div className="mt-12 text-center">
          <div className="inline-block text-gray-400 text-sm">
            —— 道阻且长，行则将至 ——
          </div>
        </div>
      </div>
    </div>
  );
}