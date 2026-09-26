// components/PageTransition.tsx

/**
 * 页面级加载动画组件
 *
 * 支持两种转场动画：
 *
 * 1. FogTransition（云雾粒子）：默认转场，用于大多数页面跳转
 *    - 聚拢(800ms) → 跳转 → 停留(600ms) → 消散(800ms)
 *
 * 2. ImageTransition（图片转场）：用于公告栏↔任务大厅切换
 *    - 图片从左侧拉出，右侧固定，占满全屏后跳转
 *    - 跳转后图片左侧固定，右侧向左收拢，过程中遮盖所有内容
 *
 * navigate 支持可选 onCovered 回调：
 *    - 在云雾/图片完全聚拢后、路由跳转前执行
 *    - 用于退出登录（先覆盖再清理）和登录（先覆盖再调API）场景
 *    - 若回调抛出异常则取消跳转，直接进入消散阶段
 *
 * 布局结构：
 * 1. stable区域（Navbar等）：不参与动画，始终保持可见
 * 2. 内容区域：页面主体内容
 */
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import FogTransition from "./FogTransition";
import ImageTransition from "./ImageTransition";

/* ---------- 类型 ---------- */
type TransitionType = "fog" | "image";
/** 图片转场方向：forward=公告栏→任务大厅（左→右），reverse=任务大厅→公告栏（右→左） */
type TransitionDirection = "forward" | "reverse";
type Phase = "idle" | "covering" | "waiting" | "uncovering";

interface PageTransitionContextType {
  navigate: (href: string, onCovered?: () => void | Promise<void>) => void;
  isTransitioning: boolean;
  /** 当前转场类型 */
  transitionType: TransitionType;
  /** 当前转场阶段，供 ImageTransition 等组件使用 */
  transitionPhase: Phase;
  /** 图片转场方向（仅 transitionType 为 image 时有效） */
  transitionDirection: TransitionDirection;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

/* ---------- 时长配置（单位：ms） ---------- */
const COVER_DURATION = 800;
const UNCOVER_DURATION = 800;
const HOLD_DURATION = 600;

/* ---------- 图片转场路径 ---------- */
const IMAGE_TRANSITION_PATHS = ["/announcement", "/task-hall"];

function isImageTransition(fromPath: string, toPath: string): boolean {
  const fromMatch = IMAGE_TRANSITION_PATHS.some(p => fromPath === p || fromPath.startsWith(p + "/"));
  const toMatch = IMAGE_TRANSITION_PATHS.some(p => toPath === p || toPath.startsWith(p + "/"));
  return fromMatch && toMatch && fromPath !== toPath;
}

/**
 * 判断图片转场方向
 * forward: 公告栏 → 任务大厅（图片从左侧拉出，右侧固定，左→右覆盖）
 * reverse: 任务大厅 → 公告栏（图片从右侧拉出，左侧固定，右→左覆盖）
 */
function getImageTransitionDirection(fromPath: string, toPath: string): TransitionDirection {
  const isFromAnnouncement = fromPath === "/announcement" || fromPath.startsWith("/announcement/");
  return isFromAnnouncement ? "forward" : "reverse";
}

/**
 * 检查是否为任务大厅内部跳转
 * 定义：上一个路径和下一个路径都位于 /task-hall 下
 * 目的：移除任务大厅内的所有页面转场动画，使其交互更流畅
 * 注意：导航栏触发的全局跳转（如从首页到任务大厅）不受此影响
 */
function isTaskHallInternalNav(fromPath: string, toPath: string): boolean {
  const isTaskHall = (p: string) => p === "/task-hall" || p.startsWith("/task-hall/");
  return isTaskHall(fromPath) && isTaskHall(toPath);
}

/* ---------- Provider ---------- */
export function PageTransitionProvider({
  stable,
  children,
}: {
  stable?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [transitionType, setTransitionType] = useState<TransitionType>("fog");
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>("forward");

  const pendingHrefRef = useRef<string | null>(null);
  const pendingActionRef = useRef<(() => void | Promise<void>) | null>(null);
  const prevPathRef = useRef<string>(pathname);
  const isManualNavRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const coverTimerRef = useRef<number | null>(null);
  const isBrowserNavRef = useRef(false);

  /* ----- 检测浏览器前进/后退操作 ----- */
  useEffect(() => {
    const handlePopState = () => {
      isBrowserNavRef.current = true;
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  /* ----- 主动跳转 ----- */
  const navigate = useCallback(
    (href: string, onCovered?: () => void | Promise<void>) => {
      if (href === pathname) return;
      if (isTransitioningRef.current) return;

      // 根据路径判断转场类型
      const useImage = isImageTransition(pathname, href);
      setTransitionType(useImage ? "image" : "fog");
      if (useImage) {
        setTransitionDirection(getImageTransitionDirection(pathname, href));
      }

      pendingHrefRef.current = href;
      pendingActionRef.current = onCovered ?? null;
      isManualNavRef.current = true;
      isTransitioningRef.current = true;
      setPhase("covering");
    },
    [pathname]
  );

  // covering → waiting（主动）
  // 转场动画聚拢完成后，先执行 onCovered 回调，再执行路由跳转
  // 若回调抛出异常（如登录失败），取消跳转，直接进入消散阶段
  useEffect(() => {
    if (phase !== "covering" || !isManualNavRef.current) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (cancelled) return;
      setPhase("waiting");

      // 转场已完全覆盖，执行回调
      if (pendingActionRef.current) {
        try {
          await pendingActionRef.current();
        } catch (e) {
          // 回调失败（如登录API报错），取消跳转，直接消散
          console.error("Transition action failed:", e);
          pendingActionRef.current = null;
          pendingHrefRef.current = null;
          isManualNavRef.current = false;
          isTransitioningRef.current = false;
          setPhase("uncovering");
          return;
        }
        pendingActionRef.current = null;
      }

      if (cancelled) return;
      const href = pendingHrefRef.current;
      if (href) {
        router.push(href);
      } else {
        setPhase("uncovering");
        isManualNavRef.current = false;
        isTransitioningRef.current = false;
      }
    }, COVER_DURATION);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [phase, router]);

  // waiting → uncovering（主动）
  useEffect(() => {
    if (phase !== "waiting" || !isManualNavRef.current) return;
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      const t = window.setTimeout(() => {
        setPhase("uncovering");
        isManualNavRef.current = false;
        pendingHrefRef.current = null;
      }, HOLD_DURATION);
      return () => window.clearTimeout(t);
    }
  }, [phase, pathname]);

  /* ----- 被动路由变化 ----- */
  useEffect(() => {
    if (isBrowserNavRef.current) {
      isBrowserNavRef.current = false;
      prevPathRef.current = pathname;
      return;
    }

    if (isTransitioningRef.current) return;
    if (pathname === prevPathRef.current) return;

    // 如果是任务大厅内部跳转，跳过转场动画
    // 目的：移除任务大厅内的所有页面跳转动画，保持导航栏触发的全局动画
    if (isTaskHallInternalNav(prevPathRef.current, pathname)) {
      prevPathRef.current = pathname;
      return;
    }

    // 根据路径判断转场类型
    const useImage = isImageTransition(prevPathRef.current, pathname);
    setTransitionType(useImage ? "image" : "fog");
    if (useImage) {
      setTransitionDirection(getImageTransitionDirection(prevPathRef.current, pathname));
    }

    prevPathRef.current = pathname;
    isTransitioningRef.current = true;
    setPhase("covering");

    coverTimerRef.current = window.setTimeout(() => {
      setPhase("uncovering");
    }, COVER_DURATION + HOLD_DURATION);

    return () => {
      if (coverTimerRef.current !== null) {
        window.clearTimeout(coverTimerRef.current);
        coverTimerRef.current = null;
      }
    };
  }, [pathname]);

  // uncovering → idle
  useEffect(() => {
    if (phase !== "uncovering") return;
    const timer = window.setTimeout(() => {
      setPhase("idle");
      isTransitioningRef.current = false;
      isManualNavRef.current = false;
      pendingHrefRef.current = null;
    }, UNCOVER_DURATION);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const isActive = phase !== "idle";

  return (
    <PageTransitionContext.Provider
      value={{
        navigate,
        isTransitioning: isActive,
        transitionType,
        transitionPhase: phase,
        transitionDirection,
      }}
    >
      {stable}

      <div style={{ minHeight: "100vh" }}>
        {children}
      </div>

      {/* 根据转场类型选择动画组件 */}
      {transitionType === "image" ? <ImageTransition /> : <FogTransition />}
    </PageTransitionContext.Provider>
  );
}

/* ---------- Hook ---------- */
export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (context === undefined) {
    throw new Error("usePageTransition must be used within a PageTransitionProvider");
  }
  return context;
}
