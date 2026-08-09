// app/sect-affairs/components/PeakCard.tsx

/**
 * 峰卡片组件
 * 
 * 展示单个峰的信息，支持桌面端等距排列和移动端横向滑动。
 * 包含山形装饰、峰名称、描述、弟子数量等信息。
 */

"use client";

import { PeakInfo } from "@/types/sect";

interface PeakCardProps {
  peak: PeakInfo;
  index: number;
  activeIndex: number;
  onClick: () => void;
  isMobile?: boolean;
  cardStyle?: React.CSSProperties;
}

/** 旋转画廊统一青绿色调 */
const GALLERY = {
  bg: "linear-gradient(160deg, #F0FDFA 0%, #CCFBF1 100%)",
  bgActive: "linear-gradient(160deg, #ECFDF5 0%, #99F6E4 100%)",
  border: "#0D9488",
  borderActive: "#0F766E",
  text: "#134E4A",
  textSub: "#0F766E",
  accent: "#14B8A6",
  accentLight: "#5EEAD4",
  muted: "#94A3B8",
};

export default function PeakCard({
  peak,
  index,
  activeIndex,
  onClick,
  isMobile = false,
  cardStyle,
}: PeakCardProps) {
  const isActive = index === activeIndex;

  if (isMobile) {
    return (
      <div
        onClick={onClick}
        className="snap-center shrink-0 w-72 rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
        style={{
          background: GALLERY.bg,
          border: `2px solid ${GALLERY.border}`,
          boxShadow: "0 12px 24px -8px rgba(15, 118, 110, 0.3)",
        }}
      >
        <div className="relative h-24 overflow-hidden flex items-end justify-center">
          <svg
            width="100%"
            height="80"
            viewBox="0 0 280 80"
            preserveAspectRatio="none"
            style={{ position: "absolute", bottom: 0 }}
          >
            <path
              d="M0,60 L60,30 L120,55 L180,20 L240,50 L280,55 L280,80 L0,80 Z"
              fill={GALLERY.accent}
              fillOpacity="0.3"
            />
          </svg>
          <svg width="48" height="48" viewBox="0 0 64 64" className="relative z-10 mb-1">
            <polygon
              points="32,8 56,54 8,54"
              fill="white"
              stroke={GALLERY.borderActive}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="36" r="8" fill="white" />
          </svg>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-xl font-bold" style={{ color: GALLERY.text }}>
              {peak.name}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(15, 118, 110, 0.1)",
                color: GALLERY.textSub,
              }}
            >
              {peak.memberCount} 弟子
            </span>
          </div>
          <p
            className="text-xs leading-relaxed"
            style={{ color: GALLERY.textSub, opacity: 0.85 }}
          >
            {peak.description || "山高水长，气象万千。"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="absolute left-1/2 top-1/2 cursor-pointer select-none"
      style={{
        ...cardStyle,
        marginLeft: "-140px",
        marginTop: "-250px",
        width: "280px",
        height: "500px",
      }}
    >
      <div
        className="w-full h-full rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: isActive ? GALLERY.bgActive : GALLERY.bg,
          border: `2px solid ${isActive ? GALLERY.borderActive : GALLERY.border}`,
          boxShadow: isActive
            ? "0 28px 60px -12px rgba(15, 118, 110, 0.45), 0 8px 20px -4px rgba(13, 148, 136, 0.3)"
            : "0 12px 28px -8px rgba(15, 118, 110, 0.25)",
        }}
      >
        <div className="relative h-32 overflow-hidden flex items-end justify-center">
          <svg
            width="100%"
            height="120"
            viewBox="0 0 360 120"
            preserveAspectRatio="none"
            style={{ position: "absolute", bottom: 0 }}
          >
            <defs>
              <linearGradient id={`grad-${peak.name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GALLERY.accentLight} stopOpacity="0.5" />
                <stop offset="100%" stopColor={GALLERY.accent} stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <path
              d="M0,90 L60,55 L120,80 L180,40 L240,75 L300,50 L360,85 L360,120 L0,120 Z"
              fill={`url(#grad-${peak.name})`}
            />
            <path
              d="M0,100 L80,65 L140,90 L200,50 L260,85 L320,60 L360,95 L360,120 L0,120 Z"
              fill={GALLERY.accent}
              fillOpacity="0.35"
            />
          </svg>
          <div className="relative z-10 mb-2">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <polygon
                points="32,8 56,54 8,54"
                fill="white"
                stroke={GALLERY.borderActive}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <polygon
                points="32,8 56,54 8,54"
                fill={GALLERY.accent}
                fillOpacity="0.3"
              />
              <circle cx="32" cy="36" r="9" fill="white" />
              <circle
                cx="32"
                cy="36"
                r="9"
                fill="none"
                stroke={GALLERY.borderActive}
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>

        <div className="flex-1 px-7 py-5 flex flex-col">
          <div className="flex items-baseline justify-between mb-2">
            <h2
              className="text-2xl font-bold tracking-wide"
              style={{ color: GALLERY.text }}
            >
              {peak.name}
            </h2>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: "rgba(15, 118, 110, 0.1)",
                color: GALLERY.textSub,
              }}
            >
              {peak.memberCount} 弟子
            </span>
          </div>

          <div
            className="h-px w-full mb-3"
            style={{
              background: `linear-gradient(to right, ${GALLERY.border} 0%, transparent 100%)`,
              opacity: 0.4,
            }}
          />

          <p
            className="text-sm leading-relaxed"
            style={{ color: GALLERY.textSub, opacity: 0.85 }}
          >
            {peak.description || "山高水长，气象万千。"}
          </p>

          <div className="mt-auto pt-4">
            <div
              className="text-xs flex items-center gap-2"
              style={{ color: GALLERY.textSub, opacity: 0.6 }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: GALLERY.accent }}
              />
              点击查看峰内弟子名册
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}