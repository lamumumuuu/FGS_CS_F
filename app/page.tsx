// app/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePermission } from "@/contexts/PermissionContext";
import { useNavTransition } from "@/hooks/useNavTransition";

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  sect_master: "宗主",
  grand_elder: "大长老",
  supreme_elder: "太上长老",
  honorary_elder: "荣誉长老",
  elder: "长老",
  inner_disciple: "内门弟子",
  outer_disciple: "外门弟子",
};

const PEAK_NAMES: Record<number, string> = {
  1: "项目峰",
  2: "算法峰",
  3: "电路峰",
  4: "管理台",
};

const ANIM_DURATION = 100; // 毫秒，动画时长

export default function Home() {
  const router = useRouter();
  const { navigate } = useNavTransition();
  const { isAuthenticated, user, roleNames, peakIds, loading } = usePermission();  // 移除未使用的 isGlobal

  const [activePanel, setActivePanel] = useState<"task" | "announcement" | null>(null);
  const [lockedPanel, setLockedPanel] = useState<"task" | "announcement" | null>(null);
  const [rotation, setRotation] = useState(0);
  const [animState, setAnimState] = useState<"idle" | "exit" | "enter">("idle");
  const [animPanel, setAnimPanel] = useState<"task" | "announcement" | null>(null);

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ===== 将首页纹理背景应用到 body，使导航栏半透明效果可见 =====
  useEffect(() => {
    const originalBg = document.body.style.background;
    const originalBgColor = document.body.style.backgroundColor;
    const originalBgSize = document.body.style.backgroundSize;
    const originalBgRepeat = document.body.style.backgroundRepeat;
    const originalBgBlend = document.body.style.backgroundBlendMode;

    document.body.style.background = `url('/backg.jpg')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundRepeat = 'repeat';
    document.body.style.backgroundBlendMode = 'multiply';
    document.body.style.backgroundColor = '#f4f0e6';

    return () => {
      document.body.style.background = originalBg;
      document.body.style.backgroundColor = originalBgColor;
      document.body.style.backgroundSize = originalBgSize;
      document.body.style.backgroundRepeat = originalBgRepeat;
      document.body.style.backgroundBlendMode = originalBgBlend;
    };
  }, []);

  // 面板切换动画控制（修复同步 setState 问题）
  useEffect(() => {
    if (activePanel === animPanel) return;

    if (animTimerRef.current) clearTimeout(animTimerRef.current);

    // 异步设置退出状态，避免在 effect 中同步 setState
    Promise.resolve().then(() => setAnimState("exit"));
    animTimerRef.current = setTimeout(() => {
      setAnimPanel(activePanel);
      setAnimState("enter");
      animTimerRef.current = null;
    }, ANIM_DURATION);
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, [activePanel, animPanel]);

  const getRoleDisplayName = useCallback((): string => {
    if (!roleNames || roleNames.length === 0) return "外门弟子";
    for (const role of roleNames) {
      if (ROLE_DISPLAY_NAMES[role]) return ROLE_DISPLAY_NAMES[role];
    }
    return roleNames[0];
  }, [roleNames]);

  const getPeakDisplayName = useCallback((): string => {
    if (!peakIds || peakIds.length === 0) return "无";
    return PEAK_NAMES[peakIds[0]] || `峰 ${peakIds[0]}`;
  }, [peakIds]);

  const lingshi = user?.lingshi ?? 0;

  // 鼠标进入：悬停防抖 50ms，避免快速划过即触发
  const handleTaskEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setActivePanel((prev) => {
        if (prev !== "task") setRotation((r) => r + 360);
        return "task";
      });
    }, 50);
  };

  const handleAnnouncementEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setActivePanel((prev) => {
        if (prev !== "announcement") setRotation((r) => r + 360);
        return "announcement";
      });
    }, 50);
  };

  // 鼠标离开：清除防抖并立即恢复面板
  const handleLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
    const target = lockedPanel || null;
    setActivePanel(target);
    setAnimPanel(target);
    setAnimState("enter");
  };

  // 点击锁定 / 解锁（每次点击都旋转八卦图）
  const handleTaskClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setRotation((r) => r + 360);
    if (lockedPanel === "task") {
      setLockedPanel(null);
      setActivePanel(null);
      setAnimPanel(null);
      setAnimState("enter");
    } else {
      setLockedPanel("task");
      setActivePanel("task");
      setAnimPanel("task");
      setAnimState("enter");
    }
  };

  const handleAnnouncementClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setRotation((r) => r + 360);
    if (lockedPanel === "announcement") {
      setLockedPanel(null);
      setActivePanel(null);
      setAnimPanel(null);
      setAnimState("enter");
    } else {
      setLockedPanel("announcement");
      setActivePanel("announcement");
      setAnimPanel("announcement");
      setAnimState("enter");
    }
  };

  // 右侧面板内容渲染
  const renderRightPanel = () => {
    if (loading) return <div className="text-gray-500 text-lg">加载中...</div>;

    const panelType = animPanel;

    if (panelType === "task") {
      return (
        <div className="w-full h-full flex flex-row-reverse items-center justify-center gap-12 p-8">
          <div className="font-shan writing-mode-vertical-rl text-5xl text-gray-800 tracking-[0.6em] leading-[2.5]">
            任务大厅
          </div>
          <div className="writing-mode-vertical-rl text-xl text-gray-600 leading-relaxed tracking-[0.9em]">
            悬赏历练&nbsp;积累灵石
          </div>
          <Link
            href="/task-hall"
            onClick={(e) => { e.preventDefault(); navigate("/task-hall"); }}
            className="writing-mode-vertical-rl px-9 py-2 bg-transparent text-red-600 font-bold text-3xl tracking-[0.9em] transition-colors hover:text-red-700"
          >
            进入大厅
          </Link>
        </div>
      );
    }

    if (panelType === "announcement") {
      return (
        <div className="w-full h-full flex flex-row-reverse items-center justify-center gap-12 p-8">
          <div className="font-shan writing-mode-vertical-rl text-5xl text-gray-800 tracking-[0.6em] leading-[2.5]">
            公告栏
          </div>
          <div className="writing-mode-vertical-rl text-xl text-gray-600 leading-relaxed tracking-[0.9em]">
            宗门公告&nbsp;活动动态
          </div>
          <Link
            href="/announcement"
            onClick={(e) => { e.preventDefault(); navigate("/announcement"); }}
            className="writing-mode-vertical-rl px-9 py-2 bg-transparent text-red-600 font-bold text-3xl tracking-[0.9em] transition-colors hover:text-red-700"
          >
            查看公告
          </Link>
        </div>
      );
    }

    // 个人信息（默认）
    if (isAuthenticated && user) {
      return (
        <div className="w-full h-full flex flex-row-reverse items-center justify-center gap-6 p-8">
          <div className="writing-mode-vertical-rl text-5xl font-shan text-gray-800 tracking-[0.4em] leading-[2.5]">
            {user.username}
          </div>
          <div className="writing-mode-vertical-rl text-xl text-gray-600 tracking-[0.25em] leading-loose flex flex-col items-start gap-2">
            <span>角色&nbsp;{getRoleDisplayName()}</span>
            <span>属峰&nbsp;{getPeakDisplayName()}</span>
            <span>灵石 {lingshi} </span>
          </div>
          <Link
            href="/profile"
            onClick={(e) => { e.preventDefault(); navigate("/profile"); }}
            className="writing-mode-vertical-rl px-9 py-2 bg-transparent text-red-600 font-bold text-3xl tracking-[0.9em] transition-colors hover:text-red-700"
          >
            个人中心
          </Link>
        </div>
      );
    }

    // 未登录
    return (
      <div
        onClick={() => navigate("/auth")}
        className="w-full h-full flex flex-row-reverse items-center justify-center gap-12 p-8 cursor-pointer"
      >
        <div className="writing-mode-vertical-rl text-5xl font-shan text-gray-900 tracking-[0.4em] leading-[2.5]">
          访客
        </div>
        <div className="writing-mode-vertical-rl text-xl text-gray-600 tracking-[0.3em]">
          登录后查看个人信息
        </div>
      </div>
    );
  };

  const panelAnimClass =
    animState === "exit"
      ? "animate-slide-out-bottom"
      : animState === "enter"
        ? "animate-slide-in-from-top"
        : "";

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{
        backgroundColor: "#f4f0e6",
        backgroundImage: `url('/backg.jpg')`,
        backgroundSize: "cover",
        backgroundRepeat: "repeat",
        backgroundBlendMode: "multiply",
      }}
    >
      {/* 左侧：太极八卦区 */}
      <div
        className="relative flex-shrink-0"
        style={{
          width: "min(calc(100vh - 80px), 30vw)",
          height: "100vh",
          marginLeft: "200px",
          pointerEvents: "none",
        }}
      >
        {/* 新版八卦图（增加阴影和缓动） */}
        <div
          className="absolute inset-0 transition-transform ease-in-out pointer-events-none"
          style={{
            transform: `rotate(${rotation}deg) `,
            transition: `transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) `,
            filter: "drop-shadow(0 0 8px rgba(0,0,0,0.1)) drop-shadow(0 0 4px rgba(255,255,255,0.4))",
          }}
        >
          <svg className="w-full h-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="ink-blur">
                <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <line id="solid-line" x1="-20" y1="0" x2="20" y2="0" stroke="#5a5750" strokeWidth="3" strokeLinecap="round" />
              <g id="broken-line">
                <line x1="-20" y1="0" x2="-5" y2="0" stroke="#5a5750" strokeWidth="3" strokeLinecap="round" />
                <line x1="5" y1="0" x2="20" y2="0" stroke="#5a5750 " strokeWidth="3" strokeLinecap="round" />
              </g>
            </defs>

            <circle cx="200" cy="200" r="190" fill="none" stroke="rgba(0, 0, 0, 0)" strokeWidth="1" />

            <path d="M200,10 A190,190 0 0,0 200,390 A95,95 0 0,1 200,200 A95,95 0 0,0 200,10 Z" fill="rgba(5, 5, 5, 0.5)" filter="url(#ink-blur)" />
            <path d="M200,10 A190,190 0 0,1 200,390 A95,95 0 0,0 200,200 A95,95 0 0,1 200,10 Z" fill="rgb(225, 218, 200)" filter="url(#ink-blur)" transform="scale(1, -1) translate(0, -400)" />

            <circle cx="200" cy="105" r="18" fill="rgb(225, 218, 200)" className="animate-breathe-slow" />
            <circle cx="200" cy="105" r="6" fill="rgba(84,27,27,0)" />
            <circle cx="200" cy="295" r="18" fill="rgba(0, 0, 0, 0.7)" className="animate-breathe-slow" style={{ animationDelay: "2s" }} />
            <circle cx="200" cy="295" r="6" fill="rgba(255, 255, 255, 0)" />

            <g transform="translate(200,200)">
              <g transform="translate(0,-160)"><use href="#solid-line" y="-12" /><use href="#solid-line" y="0" /><use href="#solid-line" y="12" /></g>
              <g transform="translate(0,160) rotate(180)"><use href="#solid-line" y="-12" /><use href="#solid-line" y="0" /><use href="#solid-line" y="12" /></g>
              <g transform="translate(-160,0) rotate(-90)"><use href="#solid-line" y="-12" /><use href="#broken-line" y="0" /><use href="#solid-line" y="12" /></g>
              <g transform="translate(160,0) rotate(90)"><use href="#broken-line" y="-12" /><use href="#solid-line" y="0" /><use href="#broken-line" y="12" /></g>
              <g transform="translate(-113,-113) rotate(-45)"><use href="#broken-line" y="-12" /><use href="#solid-line" y="0" /><use href="#solid-line" y="12" /></g>
              <g transform="translate(113,-113) rotate(45)"><use href="#solid-line" y="-12" /><use href="#solid-line" y="0" /><use href="#broken-line" y="12" /></g>
              <g transform="translate(-113,113) rotate(-135)"><use href="#broken-line" y="-12" /><use href="#broken-line" y="0" /><use href="#solid-line" y="12" /></g>
              <g transform="translate(113,113) rotate(135)"><use href="#solid-line" y="-12" /><use href="#broken-line" y="0" /><use href="#broken-line" y="12" /></g>
            </g>

            <circle cx="200" cy="200" r="50" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </div>

        {/* 左侧触发区：任务大厅 */}
        <div
          className="absolute left-0 top-0 h-full w-1/2 cursor-pointer opacity-0 transition-opacity duration-100 hover:opacity-100"
          style={{
            borderRadius: "50% 0 0 50%",
            pointerEvents: "auto",
          }}
          onMouseEnter={handleTaskEnter}
          onMouseLeave={handleLeave}
          onClick={handleTaskClick}
        >
          <div className="flex h-full flex-col items-center justify-center p-8 opacity-0 transition-all duration-100 hover:opacity-100">
            <div className="text-center">
              <h2 className="mb-2 font-zhim text-4xl text-gray-700">任务大厅</h2>
              <p className="text-sm font-shan text-gray-600">悬赏历练 · 积累灵石</p>
            </div>
          </div>
        </div>

        {/* 右侧触发区：公告栏 */}
        <div
          className="absolute right-0 top-0 h-full w-1/2 cursor-pointer opacity-0 transition-opacity duration-100 hover:opacity-100"
          style={{
            borderRadius: "0 50% 50% 0",
            pointerEvents: "auto",
          }}
          onMouseEnter={handleAnnouncementEnter}
          onMouseLeave={handleLeave}
          onClick={handleAnnouncementClick}
        >
          <div className="flex h-full flex-col items-center justify-center p-8 opacity-0 transition-all duration-100 hover:opacity-100">
            <div className="text-center">
              <h2 className="mb-2 font-zhim text-4xl text-emerald-800">公告栏</h2>
              <p className="text-sm font-shan text-gray-600">宗门公告 · 活动动态</p>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：卷轴面板 */}
      <div className="flex-1 relative font-shan overflow-hidden">
        <div
          className={`absolute inset-0 flex items-center justify-center ${panelAnimClass}`}
          key={animPanel ?? "default"}
        >
          {renderRightPanel()}
        </div>
      </div>

      <div className="fixed bottom-6 right-100 z-10 text-gray-600 text-xl font-shan">
        —— 道阻且长，行则将至 ——
      </div>

      {/* 全局样式（新版动画定义） */}
      <style>{`
        @keyframes bgFlow {
          0% { background-position: 0% 0%; }
          100% { background-position: 2% 2%; }
        }
        @keyframes floatA {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.08; }
          25% { transform: translate(20px, -15px) scale(1.02); opacity: 0.12; }
          50% { transform: translate(-10px, 25px) scale(0.98); opacity: 0.06; }
          75% { transform: translate(-25px, -10px) scale(1.01); opacity: 0.1; }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.06; }
          33% { transform: translate(-15px, 20px) scale(0.99); opacity: 0.09; }
          66% { transform: translate(25px, -20px) scale(1.01); opacity: 0.05; }
        }
        @keyframes floatC {
          0%, 100% { transform: translate(0, 0); opacity: 0.05; }
          50% { transform: translate(30px, -25px); opacity: 0.1; }
        }
        .animate-float-a { animation: floatA 18s ease-in-out infinite; }
        .animate-float-b { animation: floatB 22s ease-in-out infinite; }
        .animate-float-c { animation: floatC 15s ease-in-out infinite; }
      `}</style>
    </div>
  );
}