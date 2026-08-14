// app/sect-affairs/components/CreatePeakModal.tsx

/**
 * 开辟新峰弹窗组件
 */

"use client";

import SectModal from "./SectModal";

interface CreatePeakModalProps {
  isOpen: boolean;
  onClose: () => void;
  newPeakName: string;
  newPeakDesc: string;
  onNameChange: (value: string) => void;
  onDescChange: (value: string) => void;
  peakFormError: string;
  actionLoading: boolean;
  onCreate: () => void;
}

export default function CreatePeakModal({
  isOpen,
  onClose,
  newPeakName,
  newPeakDesc,
  onNameChange,
  onDescChange,
  peakFormError,
  actionLoading,
  onCreate,
}: CreatePeakModalProps) {
  return (
    <SectModal isOpen={isOpen} onClose={onClose} title="开辟新峰">
      <div className="space-y-5">
        {peakFormError && (
          <div className="text-red-600 text-sm px-4 py-2.5 rounded-lg border border-red-200" style={{ backgroundColor: "rgba(254, 226, 226, 0.6)" }}>
            {peakFormError}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F766E" }}>
            峰名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={newPeakName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="请输入自定义峰名称（如：剑修峰、炼丹峰等）"
            className="w-full px-4 py-2.5 border-2 rounded-xl bg-teal-50/70 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm transition-all"
            style={{ borderColor: "rgba(15, 118, 110, 0.4)" }}
            maxLength={20}
          />
          <p className="text-xs text-gray-400 mt-1">{newPeakName.length}/20 字符</p>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F766E" }}>
            峰描述
          </label>
          <textarea
            value={newPeakDesc}
            onChange={(e) => onDescChange(e.target.value)}
            rows={3}
            placeholder="请输入峰的描述信息（选填）..."
            className="w-full px-4 py-2.5 border-2 rounded-xl bg-teal-50/70 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm resize-none transition-all"
            style={{ borderColor: "rgba(15, 118, 110, 0.4)" }}
          />
        </div>
        <div className="rounded-xl p-3.5 border" style={{ background: "rgba(15, 118, 110, 0.05)", borderColor: "rgba(15, 118, 110, 0.15)" }}>
          <p className="font-semibold text-sm mb-1" style={{ color: "#0F766E" }}>📝 操作说明</p>
          <p className="text-xs" style={{ color: "#5a7a6a" }}>开辟新峰将创建一个新的门派分支，加油蛄蛹者</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border-2 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
            style={{ borderColor: "rgba(15, 118, 110, 0.3)" }}>取消</button>
          <button onClick={onCreate} disabled={actionLoading || !newPeakName.trim()}
            className="flex-1 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: newPeakName.trim()
                ? "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)"
                : "#94A3B8",
              boxShadow: newPeakName.trim() ? "0 4px 12px rgba(15, 118, 110, 0.25)" : "none",
            }}>
            {actionLoading ? "创建中..." : "确认开辟"}
          </button>
        </div>
      </div>
    </SectModal>
  );
}