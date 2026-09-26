/**
 * 财务页面公共类型定义、常量与辅助函数
 *
 * 供 app/finance 下的子组件（AdjustmentCard / AllAdjustmentsModal / AdjustmentFilterBar）
 * 以及 page.tsx 共享使用。
 */

export type TabType = "overview" | "peaks" | "adjustments" | "members";
export type AdjustmentCategory = "all" | "personal";
// 筛选类型：reward 包含 reward + task_reward；peak_transfer 包含 peak_transfer_in + peak_transfer_out；peak_return 包含 peak_return_in + peak_return_out
export type AdjustmentType = "all" | "adjust_in" | "adjust_out" | "reward" | "allocate_in" | "peak_transfer" | "peak_return";

export interface PeakData {
  peakId: number;
  peakName: string;
  availableLingshi: number;
  totalLingshi: number;
  discipleCount: number;
}

export interface MemberUser {
  discipleId: number;
  name: string;
  role: string;
  peak: string;
  lingshi: number;
  user: string;
}

export interface LingshiAdjustment {
  id: number;
  discipleId: number;
  discipleName: string;
  type: string;
  amount: number;
  balance: number;
  operatorId: number;
  operatorName: string;
  remark?: string;
  createdAt?: string;
  peakId?: number;
  peakName?: string;
}

const ADJUSTMENT_TYPE_MAP: Record<string, { label: string; color: string }> = {
  adjust_in: { label: "灵石增加", color: "#059669" },
  adjust_out: { label: "灵石扣除", color: "#dc2626" },
  allocate_in: { label: "灵石分配", color: "#0D9488" },
  allocate_out: { label: "峰间调拨", color: "#7C3AED" },
  reward: { label: "任务奖励", color: "#d97706" },
  task_reward: { label: "任务奖励", color: "#d97706" },
  peak_allocate: { label: "峰间调拨", color: "#7C3AED" },
  peak_transfer_in: { label: "峰间调拨收入", color: "#7C3AED" },
  peak_transfer_out: { label: "峰间调拨支出", color: "#7C3AED" },
  peak_return_in: { label: "灵石退回收入", color: "#92400e" },
  peak_return_out: { label: "灵石退回", color: "#b45309" },
  allocate_to_member: { label: "峰灵石分配", color: "#0D9488" },
};

export { ADJUSTMENT_TYPE_MAP };

/**
 * 格式化日期字符串为 "YYYY-MM-DD HH:mm" 形式。
 * 仅财务页面（收支记录卡片）使用。
 */
export function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
