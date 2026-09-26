"use client";

import { useEffect, useRef } from "react";
import { usePermission } from "@/contexts/PermissionContext";
import { useToast } from "@/contexts/ToastContext";

/**
 * 权限自动刷新组件
 * 确保权限变更后无需重新登录即可实时生效
 *
 * 实现策略：
 * 1. 每 5 分钟自动刷新一次权限（防止长时间会话中的权限变更遗漏）
 * 2. 页面从隐藏状态恢复时（visibilitychange）立即刷新（保证实时性）
 * 3. 窗口获得焦点时（focus）刷新一次
 * 4. 监听全局 permission-denied 事件，当后端返回 403 时自动提示并刷新
 */
export default function PermissionAutoRefresh() {
  const { isAuthenticated, refreshPermissions } = usePermission();
  const { showPermissionDenied } = useToast();
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    // 立即刷新一次（确保登录后权限信息最新）
    refreshPermissions();

    // 定时刷新：每 5 分钟一次
    const intervalId = setInterval(() => {
      const now = Date.now();
      // 防止过于频繁的刷新（至少间隔 30 秒）
      if (now - lastRefreshRef.current > 30000) {
        lastRefreshRef.current = now;
        refreshPermissions();
      }
    }, 5 * 60 * 1000);

    // 页面可见性变化时刷新（用户从后台切回时）
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        if (now - lastRefreshRef.current > 5000) {
          lastRefreshRef.current = now;
          refreshPermissions();
        }
      }
    };

    // 窗口获得焦点时刷新
    const handleWindowFocus = () => {
      const now = Date.now();
      if (now - lastRefreshRef.current > 5000) {
        lastRefreshRef.current = now;
        refreshPermissions();
      }
    };

    // 全局权限不足事件监听
    const handlePermissionDenied = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const message = customEvent.detail?.message;

      // 显示权限不足提示
      if (message) {
        showPermissionDenied(message);
      } else {
        showPermissionDenied();
      }

      // 刷新权限，确保前端 UI 与后端权限同步
      refreshPermissions();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("permission-denied", handlePermissionDenied as EventListener);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("permission-denied", handlePermissionDenied as EventListener);
    };
  }, [isAuthenticated, refreshPermissions, showPermissionDenied]);

  return null;
}
