// components/FogTransition.tsx
/**
 * 云雾加载动画组件
 *
 * 使用 Canvas 粒子系统实现云雾效果，包括三个阶段：
 * 1. converge（汇聚）：粒子从屏幕边缘汇聚到随机位置
 * 2. hold（停留）：粒子保持稳定状态
 * 3. disperse（消散）：粒子向屏幕外扩散并逐渐消失
 *
 * 修复说明：
 * - 修复云雾消散阶段卡顿问题：优化粒子更新逻辑，减少每帧计算量
 * - 修复云雾未按规定时间完成消散而立即消失的bug：使用基于时间的精确计算替代简单的alpha递减
 */
"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePageTransition } from "./PageTransition";

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  speed: number;
  alpha: number;
  targetAlpha: number;
  alphaSpeed: number;
  phase: "converge" | "hold" | "disperse";
  /** 粒子创建时间，用于精确控制消散时长 */
  startTime: number;
  /** 消散起始时间 */
  disperseStartTime?: number;
  /** 消散前的初始alpha */
  disperseStartAlpha?: number;
}

export default function FogTransition() {
  const { isTransitioning } = usePageTransition();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const phaseRef = useRef<"idle" | "converge" | "hold" | "disperse">("idle");
  const animIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  /** 消散阶段的目标时长（毫秒） */
  const disperseDurationRef = useRef<number>(400);

  const CONFIG = {
    particleCount: 1000,
    spawnRate: 15,
    convergeTimeout: 800,    // 聚拢阶段时长：从聚拢开始到完成覆盖的时长
    holdMinDelay: 600,       // 停留阶段时长：聚拢完成后的停留时间
    disperseDuration: 800,   // 消散阶段时长：与聚拢时长保持一致
  };

  // Canvas 尺寸自适应
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // 粒子工厂函数
  const createParticle = (p: "converge" | "disperse"): Particle => {
    const w = canvasRef.current?.width || window.innerWidth;
    const h = canvasRef.current?.height || window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const now = Date.now();

    if (p === "converge") {
      const edge = Math.floor(Math.random() * 4);
      const margin = 120 + 100;
      let x: number, y: number;
      switch (edge) {
        case 0: x = Math.random() * w; y = -margin; break;
        case 1: x = w + margin; y = Math.random() * h; break;
        case 2: x = Math.random() * w; y = h + margin; break;
        default: x = -margin; y = Math.random() * h;
      }
      return {
        x, y,
        targetX: Math.random() * w,
        targetY: Math.random() * h,
        radius: 50 + Math.random() * 120,
        speed: 0.012 + Math.random() * 0.02,
        alpha: 0,
        targetAlpha: 0.85 + Math.random() * 0.15,
        alphaSpeed: 0.02 + Math.random() * 0.025,
        phase: "converge",
        startTime: now,
      };
    } else {
      // disperse 分支：用于消散阶段的粒子初始化
      const angle = Math.random() * 2 * Math.PI;
      const dist = Math.max(w, h) * 0.8;
      return {
        x: cx + (Math.random() - 0.5) * w * 0.2,
        y: cy + (Math.random() - 0.5) * h * 0.2,
        targetX: cx + Math.cos(angle) * dist,
        targetY: cy + Math.sin(angle) * dist,
        radius: 50 + Math.random() * 120,
        speed: 0.03 + Math.random() * 0.005,
        alpha: 0.95,
        targetAlpha: 0,
        alphaSpeed: 0, // 会在消散开始时计算
        phase: "disperse",
        startTime: now,
        disperseStartAlpha: 0.95,
      };
    }
  };

  // 动画循环
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = Date.now();
    const currentPhase = phaseRef.current;

    if (currentPhase === "converge") {
      const particles = particlesRef.current;
      if (particles.length < CONFIG.particleCount) {
        const toAdd = Math.min(CONFIG.spawnRate, CONFIG.particleCount - particles.length);
        for (let i = 0; i < toAdd; i++) {
          particles.push(createParticle("converge"));
        }
      }

      let allDone = true;
      particles.forEach((p) => {
        p.x += (p.targetX - p.x) * p.speed;
        p.y += (p.targetY - p.y) * p.speed;
        if (p.alpha < p.targetAlpha) {
          p.alpha = Math.min(p.targetAlpha, p.alpha + p.alphaSpeed * 0.6);
        }
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(1, p.radius));
        grad.addColorStop(0, `rgba(255,255,255,${Math.min(1, p.alpha * 0.9).toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(250,252,255,${(p.alpha * 0.5).toFixed(3)})`);
        grad.addColorStop(1, "rgba(240,245,255,0)");
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
        ctx.fill();

        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        if (dx * dx + dy * dy > 400 || p.alpha < p.targetAlpha * 0.95) {
          allDone = false;
        }
      });

      if (particles.length >= CONFIG.particleCount && allDone) {
        phaseRef.current = "hold";
        startTimeRef.current = now;
      }
      if (now - startTimeRef.current > CONFIG.convergeTimeout) {
        phaseRef.current = "hold";
        startTimeRef.current = now;
      }
    } else if (currentPhase === "hold") {
      particlesRef.current.forEach((p) => {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(1, p.radius));
        grad.addColorStop(0, `rgba(255,255,255,${Math.min(1, p.alpha * 0.9).toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(250,252,255,${(p.alpha * 0.5).toFixed(3)})`);
        grad.addColorStop(1, "rgba(240,245,255,0)");
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
        ctx.fill();
      });

      if (now - startTimeRef.current > CONFIG.holdMinDelay) {
        // 进入消散阶段
        phaseRef.current = "disperse";
        startTimeRef.current = now;
        disperseDurationRef.current = CONFIG.disperseDuration;

        const w = canvas.width;
        const h = canvas.height;

        // 为现有粒子设置消散参数
        particlesRef.current.forEach((p) => {
          const angle = Math.random() * 2 * Math.PI;
          const dist = Math.max(w, h) * 0.8;
          p.targetX = p.x + Math.cos(angle) * dist;
          p.targetY = p.y + Math.sin(angle) * dist;
          p.speed = 0.03 + Math.random() * 0.005;
          p.disperseStartAlpha = p.alpha;
          p.disperseStartTime = now;
          p.phase = "disperse";
        });
      }
    } else if (currentPhase === "disperse") {
      const particles = particlesRef.current;
      const disperseDuration = disperseDurationRef.current;

      // 使用基于时间的精确计算来控制消散
      particles.forEach((p) => {
        // 计算粒子移动
        p.x += (p.targetX - p.x) * p.speed;
        p.y += (p.targetY - p.y) * p.speed;

        // 基于时间计算精确的 alpha 值
        if (p.disperseStartTime !== undefined && p.disperseStartAlpha !== undefined) {
          const elapsed = now - p.disperseStartTime;
          const progress = Math.min(1, elapsed / disperseDuration);
          // 使用 ease-out 缓动函数使消散更自然
          const easedProgress = 1 - Math.pow(1 - progress, 2);
          p.alpha = p.disperseStartAlpha * (1 - easedProgress);
        }

        if (p.alpha > 0.01) {
          ctx.beginPath();
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(1, p.radius));
          grad.addColorStop(0, `rgba(255,255,255,${Math.min(1, p.alpha * 0.9).toFixed(3)})`);
          grad.addColorStop(0.5, `rgba(250,252,255,${(p.alpha * 0.5).toFixed(3)})`);
          grad.addColorStop(1, "rgba(240,245,255,0)");
          ctx.fillStyle = grad;
          ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 过滤掉已经完全消散的粒子
      particlesRef.current = particles.filter((p) => p.alpha > 0.01);

      // 检查是否完成消散：基于时间而非粒子数量
      const totalElapsed = now - startTimeRef.current;
      if (totalElapsed >= disperseDuration || particlesRef.current.length === 0) {
        particlesRef.current = [];
        phaseRef.current = "idle";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
    }

    if (phaseRef.current === "idle" && particlesRef.current.length > 0) {
      particlesRef.current = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    animIdRef.current = requestAnimationFrame(animate);
  }, []);

  // 监听 isTransitioning 启动/停止动画
  useEffect(() => {
    if (isTransitioning) {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      particlesRef.current = [];
      phaseRef.current = "converge";
      startTimeRef.current = Date.now();
      animIdRef.current = requestAnimationFrame(animate);
    } else {
      if (phaseRef.current === "hold" || phaseRef.current === "converge") {
        // 强制进入消散阶段（聚拢未完成或停留阶段时外部要求停止）
        phaseRef.current = "disperse";
        startTimeRef.current = Date.now();
        disperseDurationRef.current = CONFIG.disperseDuration;

        const w = canvasRef.current?.width || window.innerWidth;
        const h = canvasRef.current?.height || window.innerHeight;

        // 为现有粒子设置消散参数
        particlesRef.current.forEach((p) => {
          const angle = Math.random() * 2 * Math.PI;
          const dist = Math.max(w, h) * 0.8;
          p.targetX = p.x + Math.cos(angle) * dist;
          p.targetY = p.y + Math.sin(angle) * dist;
          p.speed = 0.03 + Math.random() * 0.01;
          p.disperseStartAlpha = p.alpha;
          p.disperseStartTime = Date.now();
          p.phase = "disperse";
        });

        // 重新启动动画循环
        animIdRef.current = requestAnimationFrame(animate);
      } else if (phaseRef.current === "disperse" && particlesRef.current.length > 0) {
        // 消散阶段进行中但 effect cleanup 已取消动画帧（如登录失败 →
        // PageTransition 从 uncovering→idle 导致 isTransitioning 变 false）
        // 需要重新启动动画循环以完成剩余消散
        animIdRef.current = requestAnimationFrame(animate);
      }
    }

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [isTransitioning, animate]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 99998,
        pointerEvents: "none",
      }}
    />
  );
}