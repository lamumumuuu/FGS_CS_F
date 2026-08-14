"use client";

/**
 * 单条收支记录卡片（主列表与更多详情弹窗共用）
 *
 * 渲染一条 LingshiAdjustment：类型标签、所属峰、操作人、金额、余额、时间。
 */

import { LingshiAdjustment, ADJUSTMENT_TYPE_MAP, formatDate } from "./FinanceTypes";

interface AdjustmentCardProps {
  adj: LingshiAdjustment;
}

export default function AdjustmentCard({ adj }: AdjustmentCardProps) {
  const typeInfo = ADJUSTMENT_TYPE_MAP[adj.type] || {
    label: adj.type,
    color: "#5a7a6a",
  };
  const isPositive = adj.amount > 0;
  return (
    <div
      className="rounded-xl p-4 transition-all hover:shadow-lg"
      style={{
        backgroundColor: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.3)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="px-2 py-0.5 rounded text-xs font-medium font-shan"
              style={{
                backgroundColor: typeInfo.color + "22",
                color: typeInfo.color,
              }}
            >
              {typeInfo.label}
            </span>
            {adj.peakName && (
              <span
                className="px-2 py-0.5 rounded text-xs font-medium font-shan"
                style={{
                  backgroundColor: "rgba(13, 148, 136, 0.1)",
                  color: "#0D9488",
                }}
              >
                {adj.peakName}
              </span>
            )}
            <span className="text-sm font-shan" style={{ color: "#1a4a3a" }}>
              {adj.discipleName}
            </span>
          </div>
          <div className="text-xs" style={{ color: "#5a7a6a" }}>
            操作人：{adj.operatorName}
            {adj.remark && ` · ${adj.remark}`}
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-lg font-bold font-shan"
            style={{ color: isPositive ? "#059669" : "#dc2626" }}
          >
            {isPositive ? "+" : ""}
            {adj.amount.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: "#5a7a6a" }}>
            余额: {adj.balance.toLocaleString()}
          </div>
        </div>
      </div>
      <div
        className="text-xs mt-2 pt-2"
        style={{ borderTop: "1px solid rgba(26,74,58,0.1)", color: "#5a7a6a" }}
      >
        {formatDate(adj.createdAt)}
      </div>
    </div>
  );
}
