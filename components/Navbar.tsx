// components/Navbar.tsx

/**
 * 顶部导航栏组件
 * 
 * 应用全局导航，包含 Logo、菜单、用户信息/登录入口。
 * 全局文字统一使用 font-shan 书法字体。
 * 在首页时导航栏变为半透明 + 毛玻璃效果；
 * 在任务大厅 / 公告栏时，导航栏使用深色背景（#1b120b），
 * 当前页导航项显示为小卡片包裹效果（#2d1f10），
 * 其他链接文字为暗色（#a07850），悬停时卡片平滑滑动并变亮（#d0a271）；
 * 站点标题颜色在深色导航栏时也变为 #d0a171；
 * 宗门事务 / 财务页面保持绿色半透明背景。
 * 登录/注册页面通过独立 layout 不渲染此组件。
 * 
 * 权限控制：
 * - 公告栏：全局可见（所有已登录用户均可访问）
 * - 财务：仅对拥有 finance 权限的用户可见
 * - 宗门事务：仅对拥有宗门事务权限的用户可见
 * 
 * 移动卡片修复：
 * - 路径变化时重置 hoveredIndex，确保跳转完成后移动卡片自动定位到当前页选项，
 *   无需等待鼠标离开导航栏。
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { siteConfig, navMenuItems, routes } from "@/siteConfig";
import { useState, useEffect, useRef } from "react";
import { usePermission } from "@/contexts/PermissionContext";
import { usePageTransition } from "@/components/PageTransition";
import { rbacApi } from "@/app/api/client";
import type { Peak } from "@/types/rbac";

/** 角色名 → 中文展示名映射（兜底，优先使用后端返回的 displayName） */
const ROLE_DISPLAY: Record<string, string> = {
  sect_master: "宗主",
  grand_elder: "大长老",
  supreme_elder: "太上长老",
  honor_elder: "名誉长老",
  elder: "长老",
  inner_disciple: "内门弟子",
  outer_disciple: "外门弟子",
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, roles, peakIds, logout, hasPermission, refreshLingshi } = usePermission();
  const { navigate: transitionNavigate, isTransitioning } = usePageTransition();

  /**
   * 统一导航点击处理：拦截默认跳转，先显示覆盖全屏的加载动画，
   * 动画持续显示一段时间后再执行页面跳转，并伴随收回过渡效果。
   * 防止用户在加载过程中与页面其他元素交互。
   */
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (href === pathname || isTransitioning) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setShowAvatarDropdown(false);
    transitionNavigate(href);
  };

  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 导航菜单项 refs，用于计算滑动指示器位置
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 峰列表缓存（用于在个人信息弹窗中展示用户所属峰名称）
  const [peaks, setPeaks] = useState<Peak[]>([]);
  const [peaksLoaded, setPeaksLoaded] = useState(false);

  // 判断用户是否有宗门事务权限（管理台入口）
  const hasSectAffairsPermission = isAuthenticated && (
    hasPermission("peak:create") ||
    hasPermission("member:update_role") ||
    hasPermission("member:expel") ||
    hasPermission("peak:manage_members") ||
    hasPermission("finance:adjust_lingshi")
  );

  // 判断用户是否有财务权限
  const hasFinancePermission = isAuthenticated && (
    hasPermission("finance:view_all") ||
    hasPermission("finance:view_own_peak")
  );

  // 根据权限过滤导航菜单项
  // 公告栏全局可见（无权限限制）
  const filteredNavItems = navMenuItems.filter(item => {
    if (item.href === routes.sectAffairs) {
      return hasSectAffairsPermission;
    }
    if (item.href === routes.finance) {
      return hasFinancePermission;
    }
    // 首页、任务大厅、公告栏默认可见
    return true;
  });

  // 当前页面对应的菜单索引（如果路径匹配）
  const activeIndex = filteredNavItems.findIndex(item => item.href === pathname);

  // 判断当前所在页面
  const isHomePage = pathname === "/";
  const isTaskHall = pathname === "/task-hall" || pathname.startsWith("/task-hall/");
  const isSectAffairs = pathname === "/sect-affairs" || pathname.startsWith("/sect-affairs/");
  const isAnnouncement = pathname === "/announcement" || pathname.startsWith("/announcement/");
  const isFinance = pathname === "/finance" || pathname.startsWith("/finance/");

  // 深色导航栏：任务大厅与公告栏使用统一的深色风格
  const isDarkNavbar = isTaskHall || isAnnouncement;

  // 获取灵石数量
  const lingshi = user?.lingshi ?? 0;

  // 外部点击关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAvatarDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * 路径变化时重置 hover 状态。
   * 修复：从其他页面跳转到深色导航栏页面（任务大厅/公告栏）时，
   * 移动卡片应在跳转完成后自动定位到当前页选项，
   * 无需等待鼠标离开导航栏。
   */
  useEffect(() => {
    setHoveredIndex(null);
  }, [pathname]);

  // 计算指示器位置 —— 必须放在早期返回之前，避免 hooks 规则错误
  useEffect(() => {
    if (!isDarkNavbar) {
      setIndicatorStyle({ opacity: 0 });
      return;
    }
    const targetIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;
    if (targetIndex === -1) {
      setIndicatorStyle({ opacity: 0 });
      return;
    }
    // 使用 requestAnimationFrame 避免同步 setState 警告
    const rafId = requestAnimationFrame(() => {
      const targetEl = navRefs.current[targetIndex];
      if (targetEl) {
        const { offsetLeft, offsetWidth } = targetEl;
        setIndicatorStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
          opacity: 1,
          transition: "left 0.3s ease, width 0.3s ease, opacity 0.3s ease",
        });
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [isDarkNavbar, hoveredIndex, activeIndex]);

  // 打开个人信息弹窗时按需加载峰列表（仅加载一次，缓存复用）
  useEffect(() => {
    if (showAvatarDropdown && !peaksLoaded) {
      rbacApi.getAllPeaks()
        .then((data) => {
          setPeaks(data || []);
          setPeaksLoaded(true);
        })
        .catch((err) => {
          console.warn("加载峰列表失败:", err);
          setPeaksLoaded(true);
        });
    }
  }, [showAvatarDropdown, peaksLoaded]);

  // 早期返回：认证页面不显示导航栏
  if (pathname === "/login" || pathname === "/register" || pathname === "/auth") {
    return null;
  }

  async function handleLogout() {
    setShowAvatarDropdown(false);
    // 先启动云雾聚拢动画，聚拢完成后再执行退出登录清理操作，最后跳转
    transitionNavigate("/auth", async () => {
      await logout();
    });
  }

  async function handleRefreshLingshi() {
    try {
      // 使用轻量级的灵石刷新，避免不必要的全量权限重载
      await refreshLingshi();
    } catch (error) {
      console.error("刷新灵石数据失败:", error);
    }
  }

  // 导航栏样式
  let navStyle: React.CSSProperties = { backgroundColor: "#f3efe5" };
  if (isHomePage) {
    navStyle = {
      backgroundColor: "rgba(248, 243, 230, 0.4)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    };
  } else if (isSectAffairs || isFinance) {
    navStyle = {
      backgroundColor: "rgba(147, 193, 168, 0.5)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(147, 193, 168, 0.2)",
    };
  } else if (isDarkNavbar) {
    // 任务大厅与公告栏：统一的深色背景
    navStyle = {
      backgroundColor: "#1b120b",
      borderBottom: "1px solid #3a2a1e",
    };
  }

  // 深色导航栏专用的菜单项渲染（任务大厅 + 公告栏共用）
  const renderDarkMenu = () => {
    return (
      <div className="flex items-center gap-2 relative" style={{ position: "relative" }}>
        {/* 滑动背景卡片 */}
        <div
          className="absolute rounded-none"
          style={{
            ...indicatorStyle,
            top: "50%",
            transform: "translateY(-50%)",
            height: "calc(100% - 8px)",
            backgroundColor: "#2d1f10",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
        {filteredNavItems.map((item, index) => {
          const isActive = index === activeIndex;
          const isHovered = index === hoveredIndex;
          const textColor = isActive || isHovered ? "#d0a271" : "#a07850";
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={(el) => { navRefs.current[index] = el; }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={(e) => handleNavClick(e, item.href)}
              className="relative z-10 px-3 py-2 text-lg font-medium transition-colors duration-300 font-shan"
              style={{ color: textColor }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  };

  // 通用菜单（非深色导航栏页面）
  const renderNormalMenu = () => {
    const isGreenTheme = isSectAffairs || isFinance;
    const textClass = isGreenTheme ? "text-emerald-900" : "text-gray-600";
    const hoverClass = isGreenTheme ? "hover:text-emerald-700" : "hover:text-gray-900";
    const activeClass = isGreenTheme
      ? "text-emerald-800 border-b-2 border-emerald-700 pb-1"
      : "text-gray-900 border-b-2 border-gray-800 pb-1";
    return (
      <div className="flex items-center gap-8">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => handleNavClick(e, item.href)}
            className={`text-base font-medium transition-colors font-shan ${hoverClass} ${pathname === item.href ? activeClass : textClass
              }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    );
  };

  // 计算当前用户所属峰名称列表
  const userPeakNames = peakIds
    .map((pid) => peaks.find((p) => Number(p.id) === pid)?.name)
    .filter((n): n is string => Boolean(n));

  // 计算当前用户角色展示名列表
  const userRoleDisplayNames = roles.map((r) => r.displayName || ROLE_DISPLAY[r.name] || r.name);

  return (
    <nav
      className={`px-6 py-4 ${isDarkNavbar ? "" : (isSectAffairs || isFinance) ? "" : "shadow-sm"} ${isDarkNavbar ? "" : (isSectAffairs || isFinance) ? "" : "border-b border-gray-200"}`}
      style={{ ...navStyle, position: "relative", zIndex: 9999 }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo 区域 */}
        <div className="flex items-center gap-3">
          <Link href="/" onClick={(e) => handleNavClick(e, "/")} className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt={siteConfig.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className="font-shan text-2xl font-bold"
              style={{ color: isDarkNavbar ? "#d0a171" : (isSectAffairs || isFinance) ? "#1a4a3a" : undefined }}
            >
              {siteConfig.name}
            </span>
          </Link>
        </div>

        {/* 导航菜单 */}
        {isDarkNavbar ? renderDarkMenu() : renderNormalMenu()}

        {/* 用户区域 */}
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div ref={dropdownRef} className="relative" style={{ zIndex: 100000 }}>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isDarkNavbar
                    ? "border-gray-500 bg-gray-700"
                    : (isSectAffairs || isFinance)
                      ? "border-emerald-700 bg-emerald-50"
                      : "border-gray-400 bg-gray-100"
                    }`}
                >
                  <span className="text-lg">👤</span>
                </div>
                <span
                  className={`text-medium font-medium hidden sm:block font-shan ${isDarkNavbar ? "text-gray-200" : (isSectAffairs || isFinance) ? "text-emerald-900" : "text-gray-700"
                    }`}
                >
                  {user.username}
                </span>
              </div>

              {showAvatarDropdown && (
                <div
                  className="absolute right-0 top-12 w-80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{
                    backgroundColor: "#f3efe5",
                    border: "1px dashed #333",
                    borderRadius: "0px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
                    zIndex: 100001,
                  }}
                >
                  {/* 基本信息 + 灵石信息（灵石图标置于右侧，数量显示在图标正下方） */}
                  <div className="p-4 border-b border-gray-300">
                    <div className="flex items-start gap-3">
                      {/* 左侧：头像 + 用户名 + 峰信息 + 角色信息 */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-xl flex-shrink-0 border border-gray-300">
                          👤
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-lg truncate text-gray-800">
                            {user.username}
                          </div>
                          {/* 所属峰信息（替代原 ID 显示） */}
                          <div className="text-gray-600 text-xs mt-1 flex items-center gap-1">
                            <span>⛰️</span>
                            <span>
                              {userPeakNames.length > 0 ? userPeakNames.join("、") : "暂无所属峰"}
                            </span>
                          </div>
                          {/* 角色信息 */}
                          <div className="text-gray-600 text-xs mt-0.5 flex items-center gap-1">
                            <span>🎖️</span>
                            <span>
                              {userRoleDisplayNames.length > 0 ? userRoleDisplayNames.join("、") : "未分配角色"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 右侧：灵石图标 + 数量（图标在上，数量在正下方） */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <span className="text-2xl">💎</span>
                        <span className="text-lg font-bold text-amber-700 font-shan mt-0.5">
                          {lingshi.toLocaleString()}
                        </span>
                        <button
                          onClick={handleRefreshLingshi}
                          title="刷新灵石数据"
                          className="text-gray-400 hover:text-emerald-700 transition-colors text-xs mt-0.5"
                        >
                          🔄
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-2" style={{ position: "relative", zIndex: 100002 }}>
                    <Link
                      href="/profile"
                      className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-white hover:text-gray-900 flex items-center gap-2 transition-colors font-shan"
                      onClick={(e) => handleNavClick(e, "/profile")}
                    >
                      <span>👤</span>
                      <span>个人中心</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors font-shan"
                    >
                      <span>🚪</span>
                      <span>退出登录</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth"
                className={`px-4 py-2 font-medium rounded-none border border-transparent transition-colors font-shan ${isDarkNavbar
                  ? "text-gray-200 hover:bg-gray-700"
                  : (isSectAffairs || isFinance)
                    ? "text-emerald-900 hover:bg-emerald-50 hover:border-emerald-400"
                    : "text-gray-700 hover:bg-white hover:border-gray-400"
                  }`}
                style={{ backgroundColor: "transparent" }}
              >
                登录
              </Link>
              <Link
                href="/auth"
                className={`px-4 py-2 font-medium rounded-none transition-colors font-shan ${isDarkNavbar
                  ? "bg-gray-200 text-gray-900 hover:bg-white"
                  : (isSectAffairs || isFinance)
                    ? "bg-emerald-700 text-white hover:bg-emerald-800"
                    : "bg-gray-800 text-white hover:bg-gray-900"
                  }`}
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
