// components/DiscipleItem.tsx

/**
 * 弟子列表项组件
 * 
 * 展示单个弟子的基础信息，支持点击和右键菜单事件。
 * compact 模式用于空间受限的场景（如侧栏），会隐藏学号和所属峰。
 */

"use client";

import { Disciple, SectRole } from "@/types/sect";

interface DiscipleItemProps {
  disciple: Disciple;                                       /// 弟子数据
  onContextMenu?: (e: React.MouseEvent, disciple: Disciple) => void;  /// 右键菜单触发回调
  onClick?: (disciple: Disciple) => void;                   /// 点击弟子触发回调
  compact?: boolean;                                        /// 是否紧凑模式
}

/** 角色对应的徽章配色 */
const roleColors: Record<SectRole, string> = {
  宗主: "bg-purple-600 text-purple-50",
  大长老: "bg-red-600 text-red-50",
  太上长老: "bg-indigo-600 text-indigo-50",
  荣誉长老: "bg-amber-500 text-amber-50",
  长老: "bg-blue-600 text-blue-50",
  内门弟子: "bg-teal-600 text-teal-50",
  外门弟子: "bg-green-600 text-green-50",
};

export default function DiscipleItem({ disciple, onContextMenu, onClick, compact = false }: DiscipleItemProps) {
  return (
    <div
      onContextMenu={(e) => onContextMenu?.(e, disciple)}
      onClick={() => onClick?.(disciple)}
      className={`flex items-center gap-3 p-3 rounded-lg bg-white border border-amber-50 hover:border-amber-200 hover:shadow-sm transition-all cursor-pointer ${
        compact ? "py-2" : ""
      }`}
    >
      {/* 头像区域：取名字首字，渐变色背景 */}
      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {disciple.name.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800 truncate">{disciple.name}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[disciple.role]}`}>
            {disciple.role}
          </span>
        </div>
        {!compact && (
          <div className="text-sm text-gray-500 truncate">
            学号：{disciple.studentId}
          </div>
        )}
      </div>

      {!compact && (
        <div className="text-sm text-amber-600 flex-shrink-0">{disciple.peak}</div>
      )}
    </div>
  );
}