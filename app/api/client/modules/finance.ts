// app/api/client/modules/finance.ts

/**
 * 财务管理 API（统一 FastAPI 账本契约）
 *
 * - 读：/api/admin/finance/{treasury,stats,peaks,transactions}
 * - 写：/api/admin/finance/{adjustments,allocations,peak-transfers}
 *
 * 金额在 JSON 中是十进制字符串，本模块统一转 number 供页面展示；
 * 提交时再转回字符串，避免浮点误差进入账本。
 */

import { nativeRequest } from "../core/native";

export interface FinancePeakRow {
  peakId: number;
  peakName: string;
  peakCode: string;
  accountId: number | null;
  balance: number;
  memberCount: number;
  isActive: boolean;
}

export interface FinanceMemberRow {
  memberId: number;
  userId: number;
  username: string;
  displayName: string | null;
  studentId: string | null;
  membershipStatus: string;
  accountId: number | null;
  balance: number;
}

export interface FinanceTxnEntry {
  accountId: number;
  kind: string;
  ownerUserId: number | null;
  ownerPeakId: number | null;
  ownerTaskId: number | null;
  ownerName: string | null;
  peakId: number | null;
  peakName: string | null;
  delta: number;
  balanceAfter: number;
  entryNo: number;
}

export interface FinanceTxnRow {
  transactionId: number;
  type: string;
  businessKey: string;
  reason: string | null;
  actorUserId: number | null;
  actorName: string | null;
  relatedTaskId: number | null;
  createdAt: string | null;
  entries: FinanceTxnEntry[];
}

/** 页面展示用的调整/流水行（与 FinanceTypes.LingshiAdjustment 对齐） */
export interface FinanceAdjustmentView {
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
  /** 账户类型：user / peak / treasury，用于「个人相关」筛选 */
  accountKind: string;
}

const PAGE_LIMIT = 200;

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** 交易类型 + 分录方向 → 页面展示类型 */
function toViewType(txType: string, delta: number): string {
  const positive = delta > 0;
  switch (txType) {
    case "issue":
    case "burn":
      return positive ? "adjust_in" : "adjust_out";
    case "allocate_peak":
      return positive ? "allocate_in" : "allocate_out";
    case "return_peak":
      return positive ? "peak_return_in" : "peak_return_out";
    case "allocate_member":
      return positive ? "allocate_to_member" : "allocate_out";
    case "peak_transfer":
      return positive ? "peak_transfer_in" : "peak_transfer_out";
    case "task_reward":
      return positive ? "reward" : "allocate_out";
    case "task_reserve":
      return positive ? "allocate_out" : "reserve";
    case "task_refund":
      return positive ? "allocate_in" : "allocate_out";
    default:
      return txType;
  }
}

function entryName(entry: FinanceTxnEntry): string {
  if (entry.ownerName) return entry.ownerName;
  if (entry.kind === "treasury") return "总库";
  if (entry.kind === "peak") return "峰账户";
  if (entry.kind === "issuance") return "发行账户";
  if (entry.kind === "task_escrow") return "任务托管";
  return "资金账户";
}

/** 只展示业务账户分录：发行对手与任务托管属于内部对冲，不进入调整日志 */
function toAdjustmentViews(tx: FinanceTxnRow): FinanceAdjustmentView[] {
  return tx.entries
    .filter((entry) => ["user", "peak", "treasury"].includes(entry.kind))
    .map((entry) => ({
      id: tx.transactionId * 1000 + entry.entryNo,
      discipleId: entry.ownerUserId ?? 0,
      discipleName: entryName(entry),
      type: toViewType(tx.type, entry.delta),
      amount: entry.delta,
      balance: entry.balanceAfter,
      operatorId: tx.actorUserId ?? 0,
      operatorName: tx.actorName ?? "系统",
      remark: tx.reason ?? undefined,
      createdAt: tx.createdAt ?? undefined,
      peakId: entry.peakId ?? undefined,
      peakName: entry.peakName ?? undefined,
      accountKind: entry.kind,
    }));
}

async function getPeakOrThrow(peakId: number): Promise<FinancePeakRow> {
  return nativeRequest<FinancePeakRow>(`/api/admin/finance/peaks/${peakId}`);
}

async function getTreasury(): Promise<{ accountId: number; total: number }> {
  const raw = await nativeRequest<{ id: number; balance: string | number }>(
    "/api/admin/finance/treasury",
  );
  return { accountId: raw.id, total: toNumber(raw.balance) };
}

export const financeApi = {
  /** 总库余额（原 /finance/total-disposable） */
  getTotalDisposable: async () => {
    const treasury = await getTreasury();
    return { total: treasury.total, description: "宗门公共可支配灵石" };
  },

  /** 全范围财务总览 */
  getStats: () =>
    nativeRequest<{
      treasury: string;
      peakTotal: string;
      userTotal: string;
      taskEscrowTotal: string;
      issuance: string;
      peakCount: number;
      userAccountCount: number;
    }>("/api/admin/finance/stats"),

  /** 峰资金列表（原 /finance/peaks） */
  getPeaksFinanceData: async (): Promise<FinancePeakRow[]> => {
    const body = await nativeRequest<{ items?: FinancePeakRow[] }>(
      `/api/admin/finance/peaks?limit=${PAGE_LIMIT}`,
    );
    return body.items ?? [];
  },

  /** 单峰资金视图（原 /finance/peak/{id}） */
  getPeakData: (peakId: number) => getPeakOrThrow(peakId),

  /** 峰成员资金摘要（原 /finance/peak/{id}/members） */
  getPeakMembers: async (peakId: number): Promise<FinanceMemberRow[]> => {
    const body = await nativeRequest<{ items?: FinanceMemberRow[] }>(
      `/api/admin/finance/peaks/${peakId}/members?limit=${PAGE_LIMIT}`,
    );
    return body.items ?? [];
  },

  /**
   * 调整/流水日志（原 /finance/adjustments 与 /finance/peak-adjustments）
   * 不传 peakId 为全范围；传 peakId 时由后端按峰账户过滤并校验范围。
   */
  listAdjustments: async (params: { peakId?: number; limit?: number } = {}) => {
    const limit = params.limit ?? PAGE_LIMIT;
    const query = new URLSearchParams({ limit: String(limit) });
    if (params.peakId !== undefined) {
      const peak = await getPeakOrThrow(params.peakId);
      if (!peak.accountId) return [] as FinanceAdjustmentView[];
      query.set("account_id", String(peak.accountId));
    }
    const body = await nativeRequest<{ items?: FinanceTxnRow[] }>(
      `/api/admin/finance/transactions?${query.toString()}`,
    );
    return (body.items ?? []).flatMap(toAdjustmentViews);
  },

  /** 总可支配灵石调整（发行 / 回收） */
  adjustTotalDisposable: async (data: {
    type: "in" | "out";
    amount: number;
    remark?: string;
  }) => {
    const treasury = await getTreasury();
    return nativeRequest("/api/admin/finance/adjustments", {
      method: "POST",
      body: JSON.stringify({
        targetAccountId: treasury.accountId,
        direction: data.type === "in" ? "issue" : "burn",
        amount: String(data.amount),
        reason: data.remark?.trim() || (data.type === "in" ? "总库发行" : "总库回收"),
      }),
    });
  },

  /** 总库 → 峰 */
  allocateToPeak: async (data: { peakId: number; amount: number; remark?: string }) => {
    const [treasury, peak] = await Promise.all([
      getTreasury(),
      getPeakOrThrow(data.peakId),
    ]);
    if (!peak.accountId) throw new Error("该峰尚未建立资金账户");
    return nativeRequest("/api/admin/finance/allocations", {
      method: "POST",
      body: JSON.stringify({
        fromAccountId: treasury.accountId,
        toAccountId: peak.accountId,
        amount: String(data.amount),
        reason: data.remark?.trim() || `拨付至${peak.peakName}`,
        operationKind: "allocation",
      }),
    });
  },

  /** 峰 → 峰 */
  peakTransfer: (data: {
    fromPeakId: number;
    toPeakId: number;
    amount: number;
    remark?: string;
  }) =>
    nativeRequest("/api/admin/finance/peak-transfers", {
      method: "POST",
      body: JSON.stringify({
        fromPeakId: data.fromPeakId,
        toPeakId: data.toPeakId,
        amount: String(data.amount),
        reason: data.remark?.trim() || "峰间调拨",
      }),
    }),

  /** 峰 → 总库 */
  returnFromPeak: async (data: { peakId: number; amount: number; remark?: string }) => {
    const [treasury, peak] = await Promise.all([
      getTreasury(),
      getPeakOrThrow(data.peakId),
    ]);
    if (!peak.accountId) throw new Error("该峰尚未建立资金账户");
    return nativeRequest("/api/admin/finance/allocations", {
      method: "POST",
      body: JSON.stringify({
        fromAccountId: peak.accountId,
        toAccountId: treasury.accountId,
        amount: String(data.amount),
        reason: data.remark?.trim() || `从${peak.peakName}退回总库`,
        operationKind: "return",
      }),
    });
  },

  /** 峰 → 成员钱包 */
  allocateToMember: async (data: {
    peakId: number;
    accountId: number;
    amount: number;
    remark?: string;
  }) => {
    const peak = await getPeakOrThrow(data.peakId);
    if (!peak.accountId) throw new Error("该峰尚未建立资金账户");
    return nativeRequest("/api/admin/finance/allocations", {
      method: "POST",
      body: JSON.stringify({
        fromAccountId: peak.accountId,
        toAccountId: data.accountId,
        amount: String(data.amount),
        reason: data.remark?.trim() || `峰内成员分配`,
        operationKind: "member_allocation",
      }),
    });
  },
};
