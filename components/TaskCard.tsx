// components/TaskCard.tsx

/**
 * 任务卡片组件 (新版设计)
 * 
 * 整体背景为静态双色渐变（#edddbc → #dcc89a，左上亮），
 * 鼠标悬停时边框发出与卡片同色系的模糊光晕。
 * 左上角为圆滑方角难度标签（半透明背景），
 * 右上角为圆滑方角状态标签（透明背景、粗边框，颜色随状态变化，透明度 0.6）。
 */

import { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

/** 难度对应的标签样式（半透明背景） */
const difficultyStyles: Record<string, string> = {
  "黑铁": "bg-gray-800/60 text-gray-200",
  "青铜": "bg-amber-800/60 text-amber-200",
  "白银": "bg-slate-500/60 text-slate-100",
  "黄金": "bg-yellow-600/60 text-yellow-100",
};

/** 状态对应的标签样式（透明背景、粗边框，文字与边框同色，透明度 0.6） */
const statusStyles: Record<string, string> = {
  "等待中": "border-blue-500 text-blue-500 border-2",
  "讨伐中": "border-red-500 text-red-500 border-2",
  "已完成": "border-green-500 text-green-500 border-2",
};

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const diffStyle = difficultyStyles[task.difficulty] || "bg-gray-500/60 text-white";
  const statusStyle = statusStyles[task.status] || "border-gray-400 text-gray-400 border-2";

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl cursor-pointer transition-all duration-300 p-5
        bg-gradient-to-br from-[#edddbc] to-[#dcc89a]
        hover:shadow-[0_0_20px_rgba(237,221,188,0.6)]
        border border-transparent hover:border-[#dcc89a]/40
      `}
    >
      {/* 左上角：难度标签 */}
      <div className={`absolute top-3 left-3 rounded-lg px-3 py-1 text-xs font-bold ${diffStyle}`}>
        {task.difficulty}
      </div>

      {/* 右上角：状态标签 */}
      <div className={`absolute top-3 right-3 rounded-lg px-3 py-1 text-xs font-medium bg-transparent ${statusStyle}`}>
        {task.status}
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-semibold text-gray-800 mt-8 mb-2 line-clamp-1">
        {task.title}
      </h3>

      {/* 描述 */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
        {task.description}
      </p>

      {/* 底部信息：灵石与截止日期 */}
      <div className="flex items-end justify-between pt-3 border-t border-amber-100">
        <div className="flex items-center gap-1 text-amber-700">
          <span className="text-sm">💎</span>
          <span className="font-bold text-lg">{task.reward}</span>
          <span className="text-sm text-amber-500">灵石</span>
        </div>
        <div className="text-sm text-gray-500">
          <span>⏳ {task.deadline}</span>
        </div>
      </div>
    </div>
  );
}