"use client";

/**
 * 灵石收支筛选栏（分类筛选 + 类型筛选 + 记录数统计）
 *
 * 由父组件维护筛选状态并通过回调同步：onCategoryChange / onTypeChange
 * 负责同时更新状态并触发数据重新加载。
 */

import { AdjustmentCategory, AdjustmentType } from "./FinanceTypes";

interface AdjustmentFilterBarProps {
  category: AdjustmentCategory;
  type: AdjustmentType;
  onCategoryChange: (v: AdjustmentCategory) => void;
  onTypeChange: (v: AdjustmentType) => void;
  /** 当前记录总数（用于统计信息展示） */
  totalCount: number;
}

export default function AdjustmentFilterBar({
  category,
  type,
  onCategoryChange,
  onTypeChange,
  totalCount,
}: AdjustmentFilterBarProps) {
  // 筛选器
  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.3)",
      }}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 日志分类筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-shan" style={{ color: "#5a7a6a" }}>分类：</span>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as AdjustmentCategory)}
            className="px-3 py-1.5 rounded-lg text-sm border focus:outline-none"
            style={{ borderColor: "rgba(15, 118, 110, 0.2)", backgroundColor: "#fff" }}
          >
            <option value="all">全部日志</option>
            <option value="personal">个人相关</option>
          </select>
        </div>

        {/* 操作类型筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-shan" style={{ color: "#5a7a6a" }}>类型：</span>
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value as AdjustmentType)}
            className="px-3 py-1.5 rounded-lg text-sm border focus:outline-none"
            style={{ borderColor: "rgba(15, 118, 110, 0.2)", backgroundColor: "#fff" }}
          >
            <option value="all">全部类型</option>
            <option value="adjust_in">灵石增加</option>
            <option value="adjust_out">灵石扣除</option>
            <option value="reward">任务奖励</option>
            <option value="allocate_in">灵石分配</option>
            <option value="peak_transfer">峰间调拨</option>
            <option value="peak_return">灵石退回</option>
          </select>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="text-sm font-shan" style={{ color: "#5a7a6a" }}>
            共 {totalCount} 条记录
          </span>
        </div>
      </div>
    </div>
  );
}
