// app/sect-affairs/components/AddCard.tsx

/**
 * 添加卡片组件
 * 
 * 展示"开辟新峰"或"添加弟子"入口，支持桌面端等距排列和移动端横向滑动。
 */

"use client";

interface AddCardProps {
  index: number;
  activeIndex: number;
  onClick: () => void;
  hasCreatePermission: boolean;
  hasAddPermission: boolean;
  isMobile?: boolean;
  cardStyle?: React.CSSProperties;
}

export default function AddCard({
  index,
  activeIndex,
  onClick,
  hasCreatePermission,
  hasAddPermission,
  isMobile = false,
  cardStyle,
}: AddCardProps) {
  const isActive = index === activeIndex;
  const label = hasCreatePermission ? "开辟新峰" : "添加弟子";
  const sub = hasCreatePermission ? "创建新的门派分支" : "招收入门新弟子";

  if (isMobile) {
    return (
      <div
        onClick={onClick}
        className="snap-center shrink-0 w-72 rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform flex flex-col items-center justify-center text-center px-6"
        style={{
          backgroundColor: "#fafafa",
          border: "2px dashed #CBD5E1",
          minHeight: "220px",
          opacity: 0.4,
        }}
      >
        <svg width="64" height="64" viewBox="0 0 80 80" className="mb-3">
          <polygon
            points="40,12 68,68 12,68"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            strokeLinejoin="round"
          />
        </svg>
        <h3 className="text-lg font-bold text-slate-600">
          {label}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {sub}
        </p>
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
        opacity: 0.4,
      }}
    >
      <div
        className="w-full h-full rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center px-8"
        style={{
          backgroundColor: isActive ? "#F8FAFC" : "#FAFAFA",
          border: `2px dashed ${isActive ? "#64748B" : "#CBD5E1"}`,
          boxShadow: isActive
            ? "0 24px 50px -12px rgba(100, 116, 139, 0.35)"
            : "0 8px 20px -8px rgba(100, 116, 139, 0.2)",
          transition: "border-color 0.3s ease, box-shadow 0.4s ease",
        }}
      >
        <div className="relative mb-6">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <polygon
              points="40,12 68,68 12,68"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              strokeLinejoin="round"
            />
            <circle
              cx="40"
              cy="44"
              r="11"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
            <line
              x1="40"
              y1="40"
              x2="40"
              y2="48"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="36"
              y1="44"
              x2="44"
              y2="44"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-600 mb-2">{label}</h3>
        <p className="text-sm text-slate-400">{sub}</p>
      </div>
    </div>
  );
}