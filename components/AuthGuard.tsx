// components/AuthGuard.tsx

/**
 * 网站访问权限守卫组件
 *
 * 包裹在应用根布局中，自动检测用户登录状态：
 * - 已登录且在认证页面：重定向至首页
 * - 未登录且在受保护页面：重定向至登录页面
 * - 权限加载中：返回 null（空白等待），不显示任何加载动画或过渡效果
 *
 * 注：初次进入网站时直接跳转到登录页面，不显示绿色加载中状态。
 */

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePermission } from "@/contexts/PermissionContext";

/* 不需要认证的页面路径 */
const PUBLIC_PATHS = ["/auth"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = usePermission();

  useEffect(() => {
    if (loading) return;

    const isPublicPage = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p)
    );

    if (isPublicPage) {
      if (isAuthenticated) {
        router.replace("/");
      }
    } else {
      if (!isAuthenticated) {
        router.replace("/auth");
      }
    }
  }, [isAuthenticated, loading, pathname, router]);

  // 权限加载中：返回 null，不显示任何加载动画或过渡效果
  if (loading) {
    return null;
  }

  const isPublicPage = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p)
  );

  // 未登录且在受保护页面：返回 null，等待重定向到登录页
  if (!isAuthenticated && !isPublicPage) {
    return null;
  }

  // 已登录且在认证页面：返回 null，等待重定向到首页
  if (isAuthenticated && isPublicPage) {
    return null;
  }

  return <>{children}</>;
}
