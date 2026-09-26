// app/sect-affairs/components/PeakModal.tsx

/**
 * 峰详情模态框组件
 * 
 * 显示峰内弟子名册，支持点击遮罩关闭。
 * 视觉风格与系统 Modal 组件统一：圆角、阴影、边框、关闭按钮位置和样式。
 */

"use client";

import { PeakInfo, Disciple } from "@/types/sect";
import DiscipleItem from "@/app/sect-affairs/components/DiscipleItem";

interface PeakModalProps {
  isOpen: boolean;
  peak: PeakInfo | null;
  members: Disciple[];
  onClose: () => void;
  onContextMenu: (e: React.MouseEvent, disciple: Disciple) => void;
}

export default function PeakModal({
  isOpen,
  peak,
  members,
  onClose,
  onContextMenu,
}: PeakModalProps) {
  if (!isOpen || !peak) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩层，点击关闭 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* 模态框主体 */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]"
      >
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between flex-shrink-0"
          style={{ borderColor: "rgba(15, 118, 110, 0.15)" }}
        >
          <h3 className="text-lg font-bold" style={{ color: "#134E4A" }}>
            {peak.name} · 弟子名册
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>
        {/* 内容区 */}
        <div className="p-4 overflow-y-auto flex-1">
          {members.length > 0 ? (
            <div className="space-y-2">
              {members.map((disciple) => (
                <DiscipleItem
                  key={disciple.id}
                  disciple={disciple}
                  onContextMenu={onContextMenu}
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">暂无弟子</div>
          )}
        </div>
      </div>
    </div>
  );
}