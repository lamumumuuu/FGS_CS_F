// components/ImageTransition.tsx

/**
 * 图片转场动画组件
 *
 * 用于公告栏↔任务大厅之间的页面切换，使用 loading.png 实现遮罩转场。
 * 支持两个方向：
 *
 * forward（公告栏 → 任务大厅）：
 * 1. covering（800ms）：图片从左侧拉出，右侧固定（左→右覆盖）
 *    - 初始：inset(0 0 0 100%)（完全隐藏，left=100%）
 *    - 目标：inset(0 0 0 0)（完全显示）
 * 3. uncovering（800ms）：图片左侧固定，右侧向左收拢
 *    - 初始：inset(0 0 0 0)
 *    - 目标：inset(0 100% 0 0)（完全隐藏，right=100%）
 *
 * reverse（任务大厅 → 公告栏）：
 * 1. covering（800ms）：图片从右侧拉出，左侧固定（右→左覆盖）
 *    - 初始：inset(0 100% 0 0)（完全隐藏，right=100%）
 *    - 目标：inset(0 0 0 0)（完全显示）
 * 3. uncovering（800ms）：图片右侧固定，左侧向右收拢
 *    - 初始：inset(0 0 0 0)
 *    - 目标：inset(0 0 0 100%)（完全隐藏，left=100%）
 *
 * 两个方向共用：
 * 2. waiting（600ms）：图片保持全屏覆盖，此时执行路由跳转
 * 4. idle：组件不渲染
 */
"use client";

import { useEffect, useState, useRef } from "react";
import { usePageTransition } from "./PageTransition";

const COVER_DURATION = 800;
const UNCOVER_DURATION = 800;
const TRANSITION_EASING = "cubic-bezier(0.25, 0.1, 0.25, 1)";

export default function ImageTransition() {
  const { isTransitioning, transitionPhase, transitionDirection } = usePageTransition();
  const [visible, setVisible] = useState(false);
  const [clipPath, setClipPath] = useState("inset(0 0 0 100%)");
  const [transition, setTransition] = useState("none");
  const rafRef = useRef<number | null>(null);

  // 转场开始时显示
  useEffect(() => {
    if (isTransitioning) {
      setVisible(true);
    } else if (transitionPhase === "idle") {
      setVisible(false);
    }
  }, [isTransitioning, transitionPhase]);

  // 根据阶段和方向更新 clip-path，使用双 rAF 确保 CSS transition 正确触发
  useEffect(() => {
    if (!visible) return;

    // 根据方向确定各阶段的 clip-path 值
    const isReverse = transitionDirection === "reverse";
    const coverStart = isReverse ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
    const coverEnd = "inset(0 0 0 0)";
    const uncoverEnd = isReverse ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";

    if (transitionPhase === "covering") {
      // 第一步：设置初始位置（完全隐藏），禁用 transition
      setTransition("none");
      setClipPath(coverStart);

      // 第二步：下一帧启用 transition 并设置目标位置
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransition(`clip-path ${COVER_DURATION}ms ${TRANSITION_EASING}`);
          setClipPath(coverEnd);
        });
      });
    } else if (transitionPhase === "waiting") {
      // 保持全屏覆盖
      setTransition("none");
      setClipPath(coverEnd);
    } else if (transitionPhase === "uncovering") {
      // 第一步：确保从全屏覆盖开始，禁用 transition
      setTransition("none");
      setClipPath(coverEnd);

      // 第二步：下一帧启用 transition 并设置收拢目标
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransition(`clip-path ${UNCOVER_DURATION}ms ${TRANSITION_EASING}`);
          setClipPath(uncoverEnd);
        });
      });
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [transitionPhase, visible, transitionDirection]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <img
        src="/loading.png"
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          clipPath,
          WebkitClipPath: clipPath,
          transition,
        }}
      />
    </div>
  );
}
