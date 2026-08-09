// hooks/useNavTransition.ts

/**
 * 统一页面跳转导航 Hook
 *
 * 封装 PageTransition 的 navigate 方法，提供全局统一的页面跳转入口。
 * 所有页面级跳转（退出登录、首页卡片跳转、表单提交后跳转等）
 * 均应通过此 Hook 实现，确保路由跳转逻辑统一且符合应用架构规范。
 *
 * 使用方式：
 *   const { navigate } = useNavTransition();
 *   navigate("/task-hall");
 *
 * 与直接使用 router.push 的区别：
 * - 先显示覆盖全屏的加载动画（从右侧拉出）
 * - 动画持续 400ms 后执行页面跳转
 * - 新页面加载完成后动画平滑收回
 * - 整个过程防止用户与页面其他元素交互
 */

"use client";

import { usePageTransition } from "@/components/PageTransition";

export function useNavTransition() {
  const { navigate, isTransitioning } = usePageTransition();

  /**
   * 统一页面跳转方法
   * @param href 目标路径
   * @param onCovered 可选回调，在云雾聚拢完成后、路由跳转前执行（如退出登录清理操作）
   */
  const navTo = (href: string, onCovered?: () => void | Promise<void>) => {
    navigate(href, onCovered);
  };

  return { navigate: navTo, isTransitioning };
}
