// app/sect-affairs/components/DiscipleTable.tsx

/**
 * 弟子名册表格组件
 * 
 * 包含搜索筛选栏和弟子列表表格，支持右键菜单（桌面端）/长按菜单（移动端）和批量操作。
 * "添加弟子"按钮整合至搜索栏门派批量调整后方，批量模式下自动隐藏。
 * 颜色风格与宗门事务页面统一：青绿主色调 + 暖黄背景。
 */

"use client";

import { Disciple, SectPeak, SectRole } from "@/types/sect";
import { useState, useRef, useCallback } from "react";

interface DiscipleTableProps {
  disciples: Disciple[];
  searchKeyword: string;
  filterPeak: SectPeak | "全部";
  onSearchChange: (keyword: string) => void;
  onFilterChange: (peak: SectPeak | "全部") => void;
  onContextMenu: (e: React.MouseEvent, disciple: Disciple) => void;
  hasManagePermission: boolean;
  canMoveDisciple: boolean;
  canDeleteDisciple: boolean;
  canAddDisciple?: boolean;
  canViewHistory?: boolean;
  onAddDiscipleClick?: () => void;
  onViewHistoryClick?: () => void;
  onMove: (disciple: Disciple) => void;
  onDelete: (disciple: Disciple) => void;
  peaks?: SectPeak[];
}

/** 基础峰配色 */
const BASE_PEAK_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  "项目峰": { bg: "rgba(15, 118, 110, 0.08)", border: "#0D9488", text: "#0F766E", accent: "#14B8A6" },
  "算法峰": { bg: "rgba(59, 130, 246, 0.08)", border: "#3B82F6", text: "#1D4ED8", accent: "#60A5FA" },
  "电路峰": { bg: "rgba(245, 158, 11, 0.08)", border: "#F59E0B", text: "#B45309", accent: "#FBBF24" },
  "管理台": { bg: "rgba(168, 85, 247, 0.08)", border: "#A855F7", text: "#7E22CE", accent: "#C084FC" },
};

/** 动态峰配色生成器 */
const PEAK_COLOR_PALETTE = [
  { bg: "rgba(15, 118, 110, 0.08)", border: "#0D9488", text: "#0F766E", accent: "#14B8A6" },
  { bg: "rgba(59, 130, 246, 0.08)", border: "#3B82F6", text: "#1D4ED8", accent: "#60A5FA" },
  { bg: "rgba(245, 158, 11, 0.08)", border: "#F59E0B", text: "#B45309", accent: "#FBBF24" },
  { bg: "rgba(168, 85, 247, 0.08)", border: "#A855F7", text: "#7E22CE", accent: "#C084FC" },
  { bg: "rgba(239, 68, 68, 0.08)", border: "#EF4444", text: "#DC2626", accent: "#F87171" },
  { bg: "rgba(236, 72, 153, 0.08)", border: "#EC4899", text: "#BE185D", accent: "#F472B6" },
  { bg: "rgba(14, 165, 233, 0.08)", border: "#0EA5E9", text: "#0284C7", accent: "#38BDF8" },
];

function getPeakColors(peakName: string) {
  if (BASE_PEAK_COLORS[peakName]) {
    return BASE_PEAK_COLORS[peakName];
  }
  const index = peakName.length % PEAK_COLOR_PALETTE.length;
  return PEAK_COLOR_PALETTE[index];
}

export default function DiscipleTable({
  disciples,
  searchKeyword,
  filterPeak,
  onSearchChange,
  onFilterChange,
  onContextMenu,
  hasManagePermission,
  canMoveDisciple,
  canDeleteDisciple,
  canAddDisciple,
  canViewHistory,
  onAddDiscipleClick,
  onViewHistoryClick,
  onMove,
  onDelete,
  peaks = [],
}: DiscipleTableProps) {
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  // 长按处理
  const handleTouchStart = useCallback((e: React.TouchEvent, disciple: Disciple) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      const syntheticEvent = {
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
        preventDefault: () => { },
      } as unknown as React.MouseEvent;
      onContextMenu(syntheticEvent, disciple);
    }, 500);
  }, [onContextMenu]);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((_e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // 批量操作处理
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === disciples.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(disciples.map((d) => d.id)));
    }
  };

  const exitBatchMode = () => {
    setBatchMode(false);
    setSelectedIds(new Set());
  };

  /* ---------- 批量删除操作前的权限与数量检查 ---------- */
  const handleBatchDelete = () => {
    if (!canDeleteDisciple) return; // 必须拥有删除权限才能执行
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 名弟子吗？此操作不可撤销。`)) return;
    selectedIds.forEach((id) => {
      const disciple = disciples.find((d) => d.id === id);
      if (disciple) onDelete(disciple);
    });
    exitBatchMode();
  };

  /* ---------- 批量移动操作前的权限检查 ---------- */
  const handleBatchMove = () => {
    if (!canMoveDisciple) return; // 必须拥有移动权限才能执行
    if (selectedIds.size === 0) return;
    const firstDisciple = disciples.find((d) => d.id === Array.from(selectedIds)[0]);
    if (firstDisciple) onMove(firstDisciple);
    exitBatchMode();
  };

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(135deg, #F0FDFA 0%, #ECFDF5 100%)",
        border: "1px solid rgba(15, 118, 110, 0.15)",
        boxShadow: "0 4px 20px -4px rgba(15, 118, 110, 0.12)",
      }}
    >
      {/* 搜索筛选栏 */}
      <div
        className="p-5 border-b flex flex-col sm:flex-row gap-4 items-stretch sm:items-center"
        style={{ borderColor: "rgba(15, 118, 110, 0.12)" }}
      >
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索弟子姓名或学号..."
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border-2 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm transition-all"
              style={{
                borderColor: "rgba(15, 118, 110, 0.2)",
              }}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-nowrap">
          <span className="text-sm text-gray-600 whitespace-nowrap">门派：</span>
          <select
            value={filterPeak}
            onChange={(e) => onFilterChange(e.target.value as SectPeak | "全部")}
            className="px-3 py-2 border-2 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm cursor-pointer transition-all"
            style={{
              borderColor: "rgba(15, 118, 110, 0.2)",
            }}
          >
            <option value="全部">全部</option>
            {peaks.map((peak) => (
              <option key={peak} value={peak}>
                {peak}
              </option>
            ))}
          </select>

          {/* 批量调整按钮（仅非批量模式时显示） */}
          {hasManagePermission && !batchMode && (
            <button
              onClick={() => setBatchMode(true)}
              className="px-3 py-2 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all whitespace-nowrap"
              style={{ backgroundColor: "#73dacc" }}
            >
              批量调整
            </button>
          )}

          {/* 添加弟子按钮（仅非批量模式时显示，且有添加权限时显示） */}
          {canAddDisciple && onAddDiscipleClick && !batchMode && (
            <button
              onClick={onAddDiscipleClick}
              className="px-3 py-2 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all whitespace-nowrap"
              style={{ backgroundColor: "#73dacc" }}
            >
              ➕ 添加弟子
            </button>
          )}

          {/* 历史记录按钮（仅宗主角色可查看） */}
          {canViewHistory && onViewHistoryClick && !batchMode && (
            <button
              onClick={onViewHistoryClick}
              className="px-3 py-2 bg-white border border-amber-300 text-amber-700 text-sm font-medium rounded-xl hover:bg-amber-50 transition-all whitespace-nowrap"
            >
              📜 历史弟子调整记录
            </button>
          )}

          {/* 批量操作区（批量模式时显示，根据权限显示具体操作） */}
          {batchMode && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-medium text-teal-700 whitespace-nowrap px-2">
                已选 {selectedIds.size} 人
              </span>
              {canMoveDisciple && (
                <button
                  onClick={handleBatchMove}
                  disabled={selectedIds.size === 0}
                  className="px-3 py-1.5 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)" }}
                >
                  批量移动
                </button>
              )}
              {canDeleteDisciple && (
                <button
                  onClick={handleBatchDelete}
                  disabled={selectedIds.size === 0}
                  className="px-3 py-1.5 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)" }}
                >
                  批量删除
                </button>
              )}
              <button
                onClick={exitBatchMode}
                className="px-3 py-1.5 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-all whitespace-nowrap border"
                style={{ borderColor: "rgba(15, 118, 110, 0.25)" }}
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead
            style={{
              background: "linear-gradient(180deg, rgba(15, 118, 110, 0.1) 0%, rgba(20, 184, 166, 0.04) 100%)",
            }}
          >
            <tr>
              {batchMode && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === disciples.length && disciples.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
              )}
              <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#0F766E" }}>
                弟子名字
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#0F766E" }}>
                学号
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#0F766E" }}>
                担当角色
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#0F766E" }}>
                所属门派
              </th>
            </tr>
          </thead>
          <tbody
            className="divide-y"
            style={{ borderColor: "rgba(15, 118, 110, 0.08)" }}
          >
            {disciples.length === 0 ? (
              <tr>
                <td
                  colSpan={batchMode ? 5 : 4}
                  className="px-6 py-12 text-center text-gray-400"
                >
                  暂无弟子数据
                </td>
              </tr>
            ) : (
              disciples.map((disciple) => (
                <tr
                  key={disciple.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onContextMenu(e, disciple);
                  }}
                  onTouchStart={(e) => handleTouchStart(e, disciple)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="cursor-pointer transition-all select-none"
                  style={{ transitionProperty: "background-color, box-shadow" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(15, 118, 110, 0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  onClick={(e) => {
                    if (batchMode) {
                      e.stopPropagation();
                      toggleSelect(disciple.id);
                    }
                  }}
                >
                  {batchMode && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(disciple.id)}
                        onChange={() => toggleSelect(disciple.id)}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2"
                        style={{
                          background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)",
                          color: "white",
                          borderColor: "rgba(15, 118, 110, 0.2)",
                        }}
                      >
                        {disciple.name.charAt(0)}
                      </div>
                      <span className="font-medium" style={{ color: "#1F2937" }}>
                        {disciple.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {disciple.studentId || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium border"
                      style={getRoleStyle(disciple.role)}
                    >
                      {disciple.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const colors = getPeakColors(disciple.peak);
                        return (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16">
                              <polygon
                                points="8,2 14,14 2,14"
                                fill={colors.accent}
                                stroke={colors.border}
                                strokeWidth="1"
                              />
                            </svg>
                            <span
                              className="text-sm font-medium"
                              style={{ color: colors.text }}
                            >
                              {disciple.peak}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 获取角色样式 */
function getRoleStyle(role: SectRole): React.CSSProperties {
  const styles: Record<SectRole, React.CSSProperties> = {
    "宗主": { backgroundColor: "rgba(168, 85, 247, 0.1)", color: "#7E22CE", borderColor: "rgba(168, 85, 247, 0.3)" },
    "大长老": { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#DC2626", borderColor: "rgba(239, 68, 68, 0.3)" },
    "太上长老": { backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#4F46E5", borderColor: "rgba(99, 102, 241, 0.3)" },
    "荣誉长老": { backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#B45309", borderColor: "rgba(245, 158, 11, 0.3)" },
    "长老": { backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#2563EB", borderColor: "rgba(59, 130, 246, 0.3)" },
    "内门弟子": { backgroundColor: "rgba(13, 148, 136, 0.1)", color: "#0D9488", borderColor: "rgba(13, 148, 136, 0.3)" },
    "外门弟子": { backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#059669", borderColor: "rgba(16, 185, 129, 0.3)" },
  };
  return styles[role] || styles["外门弟子"];
}