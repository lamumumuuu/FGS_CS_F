"use client";

import { useState, useEffect, useCallback } from "react";
import { usePermission } from "@/contexts/PermissionContext";
import { request } from "@/app/api/client/core/request";
import { financeApi } from "@/app/api/client";
import { FINANCE_PERMISSIONS } from "@/types/permissions";
import Modal from "@/components/Modal";
import Calculator from "@/app/finance/components/Calculator";
import {
  TabType,
  AdjustmentCategory,
  AdjustmentType,
  PeakData,
  MemberUser,
  LingshiAdjustment,
} from "./components/FinanceTypes";
import AdjustmentCard from "./components/AdjustmentCard";
import AllAdjustmentsModal from "./components/AllAdjustmentsModal";
import AdjustmentFilterBar from "./components/AdjustmentFilterBar";

type ViewMode = "all" | "peak";

const ROLE_DISPLAY: Record<string, string> = {
  sect_master: "宗主",
  grand_elder: "大长老",
  elder: "长老",
  inner_disciple: "内门弟子",
  outer_disciple: "外门弟子",
};

const PEAK_NAMES: Record<number, string> = {
  1: "项目峰",
  2: "算法峰",
  3: "电路峰",
};

export default function FinancePage() {
  const { hasPermission, isAuthenticated, loading: permLoading, peakIds, refreshPermissions, user } = usePermission();

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // 调整日志筛选状态
  const [adjustmentCategory, setAdjustmentCategory] = useState<AdjustmentCategory>("all");
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("all");
  // 更多详情弹窗（灵石收支全部记录）
  const [showAllAdjustments, setShowAllAdjustments] = useState(false);

  // 总可支配灵石（宗门公共）
  const [totalDisposable, setTotalDisposable] = useState<number>(0);
  // 各峰数据
  const [peaksData, setPeaksData] = useState<PeakData[]>([]);
  // 调整日志
  const [adjustments, setAdjustments] = useState<LingshiAdjustment[]>([]);
  // 当前峰成员
  const [peakMembers, setPeakMembers] = useState<MemberUser[]>([]);
  // 当前峰可支配灵石
  const [currentPeakDisposable, setCurrentPeakDisposable] = useState<number>(0);

  // 分配弹窗
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocatingPeak, setAllocatingPeak] = useState<PeakData | null>(null);
  const [allocateAmount, setAllocateAmount] = useState(100);
  const [allocateRemark, setAllocateRemark] = useState("");
  const [allocateSubmitting, setAllocateSubmitting] = useState(false);
  const [allocateError, setAllocateError] = useState("");

  // 调拨弹窗（峰间调拨）
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFromPeak, setTransferFromPeak] = useState<PeakData | null>(null);
  const [transferToPeak, setTransferToPeak] = useState<PeakData | null>(null);
  const [transferAmount, setTransferAmount] = useState(100);
  const [transferRemark, setTransferRemark] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferError, setTransferError] = useState("");

  // 总可支配灵石调整弹窗（新增）
  const [showAdjustTotalModal, setShowAdjustTotalModal] = useState(false);
  const [adjustTotalType, setAdjustTotalType] = useState<"in" | "out">("in");
  const [adjustTotalAmount, setAdjustTotalAmount] = useState(100);
  const [adjustTotalRemark, setAdjustTotalRemark] = useState("");
  const [adjustTotalSubmitting, setAdjustTotalSubmitting] = useState(false);
  const [adjustTotalError, setAdjustTotalError] = useState("");

  // 峰灵石退回弹窗（峰 → 总库）
  const [showReturnPeakModal, setShowReturnPeakModal] = useState(false);
  const [returnPeakAmount, setReturnPeakAmount] = useState(100);
  const [returnPeakRemark, setReturnPeakRemark] = useState("");
  const [returnPeakSubmitting, setReturnPeakSubmitting] = useState(false);
  const [returnPeakError, setReturnPeakError] = useState("");

  // 峰灵石分配到个人弹窗（峰 → 弟子）
  const [showAllocateMemberModal, setShowAllocateMemberModal] = useState(false);
  const [allocatingMember, setAllocatingMember] = useState<MemberUser | null>(null);
  const [allocateMemberAmount, setAllocateMemberAmount] = useState(100);
  const [allocateMemberRemark, setAllocateMemberRemark] = useState("");
  const [allocateMemberSubmitting, setAllocateMemberSubmitting] = useState(false);
  const [allocateMemberError, setAllocateMemberError] = useState("");
  // 二次确认状态
  const [allocateMemberConfirmed, setAllocateMemberConfirmed] = useState(false);

  const canViewAll = hasPermission(FINANCE_PERMISSIONS.VIEW_ALL);
  const canViewOwnPeak = hasPermission(FINANCE_PERMISSIONS.VIEW_OWN_PEAK);
  const canAdjustLingshi = hasPermission(FINANCE_PERMISSIONS.ADJUST_LINGSHI);
  const canSetBase = hasPermission(FINANCE_PERMISSIONS.SET_BASE);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ---------- 数据加载 ---------- */
  const loadTotalDisposable = async () => {
    try {
      const data = await request<{ total: number }>("/finance/total-disposable", undefined, true);
      setTotalDisposable(data?.total ?? 0);
    } catch (err) {
      console.error("加载总可支配灵石失败:", err);
    }
  };

  const loadPeaksData = async () => {
    try {
      const data = await request<PeakData[]>("/finance/peaks", undefined, true);
      setPeaksData(data || []);
    } catch (err) {
      console.error("加载峰数据失败:", err);
    }
  };

  const loadPeakMembers = async (peakId: number) => {
    try {
      const data = await request<MemberUser[]>(`/finance/peak/${peakId}/members`, undefined, true);
      setPeakMembers(data || []);
    } catch (err) {
      console.error("加载峰成员失败:", err);
    }
  };

  const loadCurrentPeakData = async () => {
    if (peakIds.length === 0) return;
    try {
      const data = await request<PeakData>(`/finance/peak/${peakIds[0]}`, undefined, true);
      if (data) {
        setCurrentPeakDisposable(data.availableLingshi ?? 0);
        loadPeakMembers(peakIds[0]);
      }
    } catch (err) {
      console.error("加载当前峰数据失败:", err);
    }
  };

  /**
   * 根据合并后的筛选类型在前端过滤记录
   * - reward → 匹配 type === "reward" || type === "task_reward"
   * - peak_transfer → 匹配 type === "peak_transfer_in" || type === "peak_transfer_out"
   * - peak_return → 匹配 type === "peak_return_in" || type === "peak_return_out"
   */
  const filterAdjustmentsByType = (data: LingshiAdjustment[], type: AdjustmentType): LingshiAdjustment[] => {
    if (type === "all") return data;
    switch (type) {
      case "reward":
        return data.filter((adj) => adj.type === "reward" || adj.type === "task_reward");
      case "peak_transfer":
        return data.filter((adj) => adj.type === "peak_transfer_in" || adj.type === "peak_transfer_out");
      case "peak_return":
        return data.filter((adj) => adj.type === "peak_return_in" || adj.type === "peak_return_out");
      default:
        return data;
    }
  };

  const loadAdjustments = async (mode?: "all" | "peak", category?: AdjustmentCategory, type?: AdjustmentType) => {
    try {
      const effectiveCategory = category || adjustmentCategory;
      const effectiveType = type || adjustmentType;

      // 合并类型（reward / peak_transfer / peak_return）需要前端过滤：
      // API 不传 type 参数，获取全部后在前端按多个 type 值过滤
      const isMergedType =
        effectiveType === "reward" ||
        effectiveType === "peak_transfer" ||
        effectiveType === "peak_return";
      const apiType = isMergedType ? "all" : effectiveType;

      // 峰财务模式：使用 /finance/peak-adjustments 端点（仅需 view_own_peak 权限）
      // 全部财务模式：使用 /finance/adjustments 端点（需 view_all 权限）
      if (mode === "peak") {
        const params: string[] = [];
        if (apiType !== "all") params.push(`type=${apiType}`);
        const query = params.length > 0 ? `?${params.join("&")}` : "";
        const data = await request<LingshiAdjustment[]>(`/finance/peak-adjustments${query}`, undefined, true);
        setAdjustments(isMergedType ? filterAdjustmentsByType(data || [], effectiveType) : (data || []));
      } else {
        // 构建查询参数
        const params: string[] = [];
        if (apiType !== "all") params.push(`type=${apiType}`);
        if (effectiveCategory !== "all") params.push(`category=${effectiveCategory}`);
        const query = params.length > 0 ? `?${params.join("&")}` : "";
        const data = await request<LingshiAdjustment[]>(`/finance/adjustments${query}`, undefined, true);
        setAdjustments(isMergedType ? filterAdjustmentsByType(data || [], effectiveType) : (data || []));
      }
    } catch (err) {
      console.error("加载调整记录失败:", err);
    }
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      if (viewMode === "all" && canViewAll) {
        await Promise.all([
          loadTotalDisposable(),
          loadPeaksData(),
          loadAdjustments("all", adjustmentCategory, adjustmentType),
        ]);
      } else if (viewMode === "peak" && canViewOwnPeak) {
        await Promise.all([
          loadCurrentPeakData(),
          loadAdjustments("peak", adjustmentCategory, adjustmentType),
        ]);
      }
    } catch (err) {
      showToast("数据加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, [viewMode, canViewAll, canViewOwnPeak, peakIds, showToast, adjustmentCategory, adjustmentType]);

  useEffect(() => {
    if (!permLoading) {
      loadAllData();
    }
  }, [permLoading, loadAllData]);

  /* ---------- 灵石分配（总 -> 峰） ---------- */
  const handleOpenAllocate = (peak: PeakData) => {
    setAllocatingPeak(peak);
    setAllocateAmount(100);
    setAllocateRemark("");
    setAllocateError("");
    setShowAllocateModal(true);
  };

  const handleAllocateSubmit = async () => {
    if (!allocatingPeak) return;
    if (allocateAmount <= 0) {
      setAllocateError("分配金额必须大于0");
      return;
    }
    if (allocateAmount > totalDisposable) {
      setAllocateError(`总可支配灵石不足（当前：${totalDisposable}）`);
      return;
    }
    setAllocateSubmitting(true);
    try {
      await request<{ success: boolean }>(
        "/finance/allocate-to-peak",
        {
          method: "POST",
          body: JSON.stringify({
            peakId: allocatingPeak.peakId,
            amount: allocateAmount,
            remark: allocateRemark,
          }),
        },
        true
      );
      showToast(`已向 ${allocatingPeak.peakName} 分配 ${allocateAmount} 灵石`, "success");
      setShowAllocateModal(false);
      await loadAllData();
      // 通知其他模块数据同步
      refreshPermissions().catch(() => { });
    } catch (err) {
      setAllocateError(err instanceof Error ? err.message : "分配失败");
    } finally {
      setAllocateSubmitting(false);
    }
  };

  /* ---------- 峰间调拨 ---------- */
  const handleOpenTransfer = (peak: PeakData) => {
    setTransferFromPeak(peak);
    setTransferToPeak(null);
    setTransferAmount(100);
    setTransferRemark("");
    setTransferError("");
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async () => {
    if (!transferFromPeak || !transferToPeak) return;
    if (transferFromPeak.peakId === transferToPeak.peakId) {
      setTransferError("源峰与目标峰不能相同");
      return;
    }
    if (transferAmount <= 0) {
      setTransferError("调拨金额必须大于0");
      return;
    }
    if (transferAmount > transferFromPeak.availableLingshi) {
      setTransferError(`${transferFromPeak.peakName} 可支配灵石不足（当前：${transferFromPeak.availableLingshi}）`);
      return;
    }
    setTransferSubmitting(true);
    try {
      await request<{ success: boolean }>(
        "/finance/peak-transfer",
        {
          method: "POST",
          body: JSON.stringify({
            fromPeakId: transferFromPeak.peakId,
            toPeakId: transferToPeak.peakId,
            amount: transferAmount,
            remark: transferRemark,
          }),
        },
        true
      );
      showToast(`已从 ${transferFromPeak.peakName} 调拨 ${transferAmount} 灵石至 ${transferToPeak.peakName}`, "success");
      setShowTransferModal(false);
      await loadAllData();
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : "调拨失败");
    } finally {
      setTransferSubmitting(false);
    }
  };

  /* ---------- 总可支配灵石调整（新增） ---------- */
  // 打开调整弹窗
  const handleOpenAdjustTotal = () => {
    setAdjustTotalType("in");
    setAdjustTotalAmount(100);
    setAdjustTotalRemark("");
    setAdjustTotalError("");
    setShowAdjustTotalModal(true);
  };

  // 提交调整总可支配灵石
  const handleAdjustTotalSubmit = async () => {
    if (adjustTotalAmount <= 0) {
      setAdjustTotalError("调整金额必须大于0");
      return;
    }
    if (adjustTotalType === "out" && adjustTotalAmount > totalDisposable) {
      setAdjustTotalError(`总可支配灵石不足（当前：${totalDisposable}）`);
      return;
    }
    setAdjustTotalSubmitting(true);
    try {
      await request<{ success: boolean }>(
        "/finance/adjust-total-disposable",
        {
          method: "POST",
          body: JSON.stringify({
            type: adjustTotalType,
            amount: adjustTotalAmount,
            remark: adjustTotalRemark,
          }),
        },
        true
      );
      showToast(
        `${adjustTotalType === "in" ? "增加" : "减少"} ${adjustTotalAmount} 灵石成功`,
        "success"
      );
      setShowAdjustTotalModal(false);
      await loadAllData();
      // 通知其他模块数据同步
      refreshPermissions().catch(() => { });
    } catch (err) {
      setAdjustTotalError(err instanceof Error ? err.message : "调整失败");
    } finally {
      setAdjustTotalSubmitting(false);
    }
  };

  /* ---------- 峰灵石退回（峰 → 总库） ---------- */
  // 打开退回弹窗
  const handleOpenReturnPeak = () => {
    setReturnPeakAmount(100);
    setReturnPeakRemark("");
    setReturnPeakError("");
    setShowReturnPeakModal(true);
  };

  // 提交退回操作
  const handleReturnPeakSubmit = async () => {
    if (returnPeakAmount <= 0) {
      setReturnPeakError("退回金额必须大于0");
      return;
    }
    if (returnPeakAmount > currentPeakDisposable) {
      setReturnPeakError(`退回金额不得高于峰可支配灵石（当前：${currentPeakDisposable}）`);
      return;
    }
    if (peakIds.length === 0) {
      setReturnPeakError("您没有所属峰，无法执行退回操作");
      return;
    }
    setReturnPeakSubmitting(true);
    try {
      await request<{ success: boolean }>(
        "/finance/return-from-peak",
        {
          method: "POST",
          body: JSON.stringify({
            peakId: peakIds[0],
            amount: returnPeakAmount,
            remark: returnPeakRemark,
          }),
        },
        true
      );
      showToast(
        `已将 ${returnPeakAmount} 灵石从 ${currentPeakName || "当前峰"} 退回至总库`,
        "success"
      );
      setShowReturnPeakModal(false);
      await loadAllData();
      // 通知其他模块数据同步
      refreshPermissions().catch(() => { });
    } catch (err) {
      setReturnPeakError(err instanceof Error ? err.message : "退回失败");
    } finally {
      setReturnPeakSubmitting(false);
    }
  };

  /* ---------- 峰灵石分配到个人（峰 → 弟子） ---------- */
  // 打开分配弹窗
  const handleOpenAllocateMember = (member: MemberUser) => {
    setAllocatingMember(member);
    setAllocateMemberAmount(100);
    setAllocateMemberRemark("");
    setAllocateMemberError("");
    setAllocateMemberConfirmed(false);
    setShowAllocateMemberModal(true);
  };

  // 提交分配到个人
  const handleAllocateMemberSubmit = async () => {
    if (!allocatingMember) return;
    if (allocateMemberAmount <= 0) {
      setAllocateMemberError("分配金额必须大于0");
      return;
    }
    if (allocateMemberAmount > currentPeakDisposable) {
      setAllocateMemberError(`分配金额不得高于峰可支配灵石（当前：${currentPeakDisposable}）`);
      return;
    }
    if (peakIds.length === 0) {
      setAllocateMemberError("无法确定当前峰");
      return;
    }
    setAllocateMemberSubmitting(true);
    try {
      await request<{ success: boolean }>(
        "/finance/allocate-to-member",
        {
          method: "POST",
          body: JSON.stringify({
            peakId: peakIds[0],
            discipleId: allocatingMember.discipleId,
            amount: allocateMemberAmount,
            remark: allocateMemberRemark,
          }),
        },
        true
      );
      showToast(
        `已向 ${allocatingMember.name} 分配 ${allocateMemberAmount} 灵石`,
        "success"
      );
      setShowAllocateMemberModal(false);
      await loadAllData();
      // 通知其他模块数据同步
      refreshPermissions().catch(() => { });
    } catch (err) {
      setAllocateMemberError(err instanceof Error ? err.message : "分配失败");
    } finally {
      setAllocateMemberSubmitting(false);
    }
  };

  /* ---------- 数据总览统计（收入/支出/总计计算） ---------- */
  // 根据调整日志计算收入和支出
  const incomeTotal = adjustments
    .filter((adj) => adj.amount > 0)
    .reduce((sum, adj) => sum + adj.amount, 0);
  const expenseTotal = adjustments
    .filter((adj) => adj.amount < 0)
    .reduce((sum, adj) => sum + Math.abs(adj.amount), 0);
  const balanceTotal = incomeTotal - expenseTotal;

  /* ---------- 权限加载检查 ---------- */
  if (permLoading || loading) {
    return (
      <div
        className="flex-1 flex items-center justify-center min-h-[100vh]"
        style={{ backgroundColor: "#93c1a8" }}
      >
        <div className="text-xl font-shan" style={{ color: "#1a4a3a" }}>加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated || (!canViewAll && !canViewOwnPeak)) {
    return (
      <div
        className="flex-1 flex items-center justify-center min-h-[100vh]"
        style={{ backgroundColor: "#93c1a8" }}
      >
        <div className="text-center">
          <div className="text-3xl font-shan mb-4" style={{ color: "#1a4a3a" }}>无权访问</div>
          <p className="text-sm" style={{ color: "#5a7a6a" }}>您没有查看财务数据的权限</p>
        </div>
      </div>
    );
  }

  const currentPeakName = peakIds.length > 0 ? (PEAK_NAMES[peakIds[0]] || `峰 ${peakIds[0]}`) : null;

  return (
    <div
      className="flex-1 py-8 px-4 sm:px-6 lg:px-8 min-h-[100vh]"
      style={{
        background: `
          linear-gradient(rgba(147, 193, 168, 0.4), rgba(147, 193, 168, 0.6)),
          url('/backgz.jpg') center / cover no-repeat,
          radial-gradient(ellipse at top left, rgba(255, 245, 230, 0.5) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(255, 240, 220, 0.4) 0%, transparent 50%)
        `,
        backgroundColor: "#93c1a8",
      }}
    >
      {/* 卡片从下往上依次平滑显现的动画样式 */}
      <style jsx>{`
        @keyframes cardRiseIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .card-rise {
          opacity: 0;
          animation: cardRiseIn 0.5s ease-out forwards;
        }
        .card-rise-1 { animation-delay: 0.05s; }
        .card-rise-2 { animation-delay: 0.15s; }
        .card-rise-3 { animation-delay: 0.25s; }
        .card-rise-4 { animation-delay: 0.35s; }
        .card-rise-5 { animation-delay: 0.45s; }
      `}</style>
      <div className="max-w-6xl mx-auto">
        {/* 页头 */}
        <div className="card-rise card-rise-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold font-shan" style={{ color: "#1a4a3a" }}>
              财务管理
            </h1>
            <p className="text-sm mt-1" style={{ color: "#5a7a6a" }}>
              宗门灵石资产管理 · 分配与调整
            </p>
          </div>
          {(canViewAll || canViewOwnPeak) && (
            <div className="flex gap-2">
              {canViewAll && (
                <button
                  onClick={() => { setViewMode("all"); setActiveTab("overview"); }}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all font-shan"
                  style={{
                    backgroundColor: viewMode === "all" ? "#1a4a3a" : "rgba(255,255,255,0.5)",
                    color: viewMode === "all" ? "#fff" : "#5a7a6a",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  全部财务
                </button>
              )}
              {canViewOwnPeak && peakIds.length > 0 && (
                <button
                  onClick={() => { setViewMode("peak"); setActiveTab("overview"); }}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all font-shan"
                  style={{
                    backgroundColor: viewMode === "peak" ? "#1a4a3a" : "rgba(255,255,255,0.5)",
                    color: viewMode === "peak" ? "#fff" : "#5a7a6a",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  峰财务
                </button>
              )}
            </div>
          )}
        </div>

        {/* 顶部主卡片：总可支配灵石 / 当前峰可支配灵石 */}
        <div
          className="card-rise card-rise-2 rounded-2xl p-6 mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(15, 118, 110, 0.15) 0%, rgba(20, 184, 166, 0.2) 100%)",
            border: "1.5px solid rgba(15, 118, 110, 0.3)",
            boxShadow: "0 8px 32px rgba(15, 118, 110, 0.15)",
            backdropFilter: "blur(12px)",
          }}
        >
          {viewMode === "all" && canViewAll ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-shan mb-2" style={{ color: "#5a7a6a" }}>
                  总可支配灵石
                </div>
                <div
                  className="text-5xl font-bold font-shan"
                  style={{
                    color: "#0D9488",
                    textShadow: "0 2px 12px rgba(13, 148, 136, 0.3)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {totalDisposable.toLocaleString()}
                </div>
                <div className="text-xs mt-2" style={{ color: "#5a7a6a" }}>
                  宗门公共可自由支配灵石 · 不属于任何个人 · 仅财务权限用户可操作
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="text-6xl opacity-20">💎</div>
                {/* 调整灵石按钮（位于灵石图标下方） */}
                {canAdjustLingshi && (
                  <button
                    onClick={handleOpenAdjustTotal}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:shadow-lg font-shan"
                    style={{
                      background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)",
                      color: "#fff",
                    }}
                  >
                    调整灵石
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === "peak" && canViewOwnPeak ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-shan mb-2" style={{ color: "#5a7a6a" }}>
                  {currentPeakName || "当前峰"} · 可支配灵石
                </div>
                <div
                  className="text-5xl font-bold font-shan"
                  style={{
                    color: "#0D9488",
                    textShadow: "0 2px 12px rgba(13, 148, 136, 0.3)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {currentPeakDisposable.toLocaleString()}
                </div>
                <div className="text-xs mt-2" style={{ color: "#5a7a6a" }}>
                  本峰独立核算 · 仅本峰财务权限用户可操作
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="text-6xl opacity-20">⛰️</div>
                {/* 退回灵石按钮（与全部财务的"调整灵石"按钮位置一致） */}
                {canAdjustLingshi && (
                  <button
                    onClick={handleOpenReturnPeak}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:shadow-lg font-shan"
                    style={{
                      background: "linear-gradient(135deg, #92400e 0%, #b45309 100%)",
                      color: "#fff",
                    }}
                  >
                    退回灵石
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 font-shan" style={{ color: "#5a7a6a" }}>
              暂无数据
            </div>
          )}
        </div>

        {/* Tab 切换 */}
        <div className="card-rise card-rise-3 flex gap-1 mb-6 p-1 rounded-xl" style={{ backgroundColor: "rgba(26, 74, 58, 0.12)" }}>
          {viewMode === "all" && canViewAll ? (
            <>
              {[
                { key: "overview" as TabType, label: "数据总览" },
                { key: "peaks" as TabType, label: "峰列表" },
                { key: "adjustments" as TabType, label: "灵石收支" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-1 py-2.5 px-4 rounded-lg text-base font-shan transition-all duration-200"
                  style={{
                    backgroundColor: activeTab === tab.key ? "rgba(255, 255, 255, 0.75)" : "transparent",
                    color: activeTab === tab.key ? "#1a4a3a" : "#5a7a6a",
                    boxShadow: activeTab === tab.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                    backdropFilter: activeTab === tab.key ? "blur(8px)" : "none",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {[
                { key: "overview" as TabType, label: "数据总览" },
                { key: "members" as TabType, label: "峰成员" },
                { key: "adjustments" as TabType, label: "灵石收支" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-1 py-2.5 px-4 rounded-lg text-base font-shan transition-all duration-200"
                  style={{
                    backgroundColor: activeTab === tab.key ? "rgba(255, 255, 255, 0.75)" : "transparent",
                    color: activeTab === tab.key ? "#1a4a3a" : "#5a7a6a",
                    boxShadow: activeTab === tab.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                    backdropFilter: activeTab === tab.key ? "blur(8px)" : "none",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* 数据总览：收入 / 支出 / 收支总计 三张独立卡片（点击跳转灵石收支明细） */}
        {activeTab === "overview" && (
          <div className="card-rise card-rise-4 space-y-4">
            {(viewMode === "all" && canViewAll) || (viewMode === "peak" && canViewOwnPeak) ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 收入卡片 */}
                <div
                  className="rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => setActiveTab("adjustments")}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.55)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-shan" style={{ color: "#5a7a6a" }}>收入</div>
                    <span className="text-xl">📈</span>
                  </div>
                  <div
                    className="text-3xl font-bold font-shan"
                    style={{ color: "#059669" }}
                  >
                    +{incomeTotal.toLocaleString()}
                  </div>
                  <div className="text-xs mt-2 font-shan" style={{ color: "#0D9488" }}>
                    点击查看明细 →
                  </div>
                </div>

                {/* 支出卡片 */}
                <div
                  className="rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => setActiveTab("adjustments")}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.55)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-shan" style={{ color: "#5a7a6a" }}>支出</div>
                    <span className="text-xl">📉</span>
                  </div>
                  <div
                    className="text-3xl font-bold font-shan"
                    style={{ color: "#dc2626" }}
                  >
                    -{expenseTotal.toLocaleString()}
                  </div>
                  <div className="text-xs mt-2 font-shan" style={{ color: "#0D9488" }}>
                    点击查看明细 →
                  </div>
                </div>

                {/* 收支总计卡片 */}
                <div
                  className="rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => setActiveTab("adjustments")}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.55)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-shan" style={{ color: "#5a7a6a" }}>收支总计</div>
                    <span className="text-xl">💰</span>
                  </div>
                  <div
                    className="text-3xl font-bold font-shan"
                    style={{ color: balanceTotal >= 0 ? "#0D9488" : "#dc2626" }}
                  >
                    {balanceTotal >= 0 ? "+" : ""}{balanceTotal.toLocaleString()}
                  </div>
                  <div className="text-xs mt-2 font-shan" style={{ color: "#0D9488" }}>
                    点击查看明细 →
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="text-center py-12 rounded-xl font-shan"
                style={{
                  backgroundColor: "rgba(255,255,255,0.4)",
                  backdropFilter: "blur(10px)",
                  color: "#5a7a6a",
                }}
              >
                暂无数据
              </div>
            )}
          </div>
        )}

        {/* 峰列表（全部财务视图） */}
        {activeTab === "peaks" && viewMode === "all" && canViewAll && (
          <div className="card-rise card-rise-4 space-y-4">
            {peaksData.length === 0 ? (
              <div
                className="text-center py-12 rounded-xl font-shan"
                style={{
                  backgroundColor: "rgba(255,255,255,0.4)",
                  backdropFilter: "blur(10px)",
                  color: "#5a7a6a",
                }}
              >
                暂无峰数据
              </div>
            ) : (
              peaksData.map((peak) => (
                <div
                  key={peak.peakId}
                  className="rounded-xl p-5 transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.55)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium font-shan"
                          style={{
                            backgroundColor: "rgba(13, 148, 136, 0.15)",
                            color: "#0D9488",
                          }}
                        >
                          峰
                        </span>
                        <h3 className="text-lg font-bold font-shan" style={{ color: "#1a4a3a" }}>
                          {peak.peakName}
                        </h3>
                      </div>
                      <div className="text-sm" style={{ color: "#5a7a6a" }}>
                        成员：{peak.discipleCount} 人 · 累计灵石：{peak.totalLingshi.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs font-shan" style={{ color: "#5a7a6a" }}>可支配灵石</div>
                        <div
                          className="text-2xl font-bold font-shan"
                          style={{ color: "#0D9488" }}
                        >
                          {peak.availableLingshi.toLocaleString()}
                        </div>
                      </div>
                      {canAdjustLingshi && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleOpenAllocate(peak)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg font-shan"
                            style={{
                              background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)",
                              color: "#fff",
                            }}
                          >
                            分配灵石
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 峰成员（峰财务视图） */}
        {activeTab === "members" && viewMode === "peak" && canViewOwnPeak && (
          <div className="card-rise card-rise-4 space-y-4">
            {peakMembers.length === 0 ? (
              <div
                className="text-center py-12 rounded-xl font-shan"
                style={{
                  backgroundColor: "rgba(255,255,255,0.4)",
                  backdropFilter: "blur(10px)",
                  color: "#5a7a6a",
                }}
              >
                当前峰暂无成员
              </div>
            ) : (
              peakMembers.map((member) => (
                <div
                  key={member.discipleId}
                  className="rounded-xl p-4 transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.55)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: "rgba(13, 148, 136, 0.15)" }}
                      >
                        👤
                      </div>
                      <div>
                        <div className="font-bold font-shan" style={{ color: "#1a4a3a" }}>
                          {member.name}
                        </div>
                        <div className="text-xs" style={{ color: "#5a7a6a" }}>
                          {ROLE_DISPLAY[member.role] || member.role} · 账号：{member.user}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-shan" style={{ color: "#5a7a6a" }}>灵石</div>
                        <div className="text-xl font-bold font-shan" style={{ color: "#0D9488" }}>
                          {member.lingshi.toLocaleString()}
                        </div>
                      </div>
                      {/* 分配灵石到个人按钮 */}
                      {canAdjustLingshi && (
                        <button
                          onClick={() => handleOpenAllocateMember(member)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-lg font-shan"
                          style={{
                            background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)",
                            color: "#fff",
                          }}
                        >
                          分配灵石
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 灵石收支（调整日志） */}
        {activeTab === "adjustments" && (
          <div className="card-rise card-rise-4 space-y-4">
            {/* 筛选器 */}
            <AdjustmentFilterBar
              category={adjustmentCategory}
              type={adjustmentType}
              onCategoryChange={(v) => {
                setAdjustmentCategory(v);
                loadAdjustments(undefined, v, adjustmentType);
              }}
              onTypeChange={(v) => {
                setAdjustmentType(v);
                loadAdjustments(undefined, adjustmentCategory, v);
              }}
              totalCount={adjustments.length}
            />

            {adjustments.length === 0 ? (
              <div
                className="text-center py-12 rounded-xl font-shan"
                style={{
                  backgroundColor: "rgba(255,255,255,0.4)",
                  backdropFilter: "blur(10px)",
                  color: "#5a7a6a",
                }}
              >
                暂无调整记录
              </div>
            ) : (
              <>
                {/* 默认仅显示最近 3 条记录 */}
                {adjustments.slice(0, 3).map((adj) => (
                  <AdjustmentCard key={adj.id} adj={adj} />
                ))}
                {/* 记录总数 > 3 时显示"更多详情"卡片，点击弹出全部记录弹窗 */}
                {adjustments.length > 3 && (
                  <div
                    onClick={() => setShowAllAdjustments(true)}
                    className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg flex items-center justify-between"
                    style={{
                      backgroundColor: "#2b1e10",
                      border: "1px solid #332418",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base font-shan" style={{ color: "#e6c068" }}>
                        更多详情
                      </span>
                      <span className="text-xs font-shan" style={{ color: "#8a7355" }}>
                        （共 {adjustments.length} 条记录）
                      </span>
                    </div>
                    <span className="text-lg" style={{ color: "#e6c068" }}>→</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 分配灵石弹窗（总 -> 峰） */}
      <Modal
        isOpen={showAllocateModal}
        onClose={() => setShowAllocateModal(false)}
        title="灵石分配（总可支配 → 峰）"
      >
        <div className="space-y-4">
          {allocateError && (
            <div className="text-red-600 text-sm px-3 py-2 bg-red-50 rounded-lg">
              {allocateError}
            </div>
          )}
          {allocatingPeak && (
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: "rgba(15, 118, 110, 0.08)",
                border: "1px solid rgba(15, 118, 110, 0.15)",
              }}
            >
              <div className="text-sm font-shan" style={{ color: "#1a4a3a" }}>
                目标峰：{allocatingPeak.peakName}
              </div>
              <div className="text-xs mt-1" style={{ color: "#5a7a6a" }}>
                当前峰可支配：{allocatingPeak.availableLingshi.toLocaleString()}
              </div>
              <div className="text-xs mt-1" style={{ color: "#92400e" }}>
                总可支配灵石剩余：{totalDisposable.toLocaleString()}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分配金额 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={totalDisposable}
              value={allocateAmount}
              onChange={(e) => setAllocateAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              style={{ borderColor: "rgba(15, 118, 110, 0.2)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分配原因
            </label>
            <textarea
              value={allocateRemark}
              onChange={(e) => setAllocateRemark(e.target.value)}
              rows={3}
              placeholder="请输入分配原因（将记录到调整日志）..."
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
              style={{ borderColor: "rgba(15, 118, 110, 0.2)" }}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAllocateModal(false)}
              className="flex-1 px-4 py-2.5 border text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              style={{ borderColor: "rgba(15, 118, 110, 0.3)" }}
            >
              取消
            </button>
            <button
              onClick={handleAllocateSubmit}
              disabled={allocateSubmitting}
              className="flex-1 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all font-medium disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)" }}
            >
              {allocateSubmitting ? "分配中..." : "确认分配"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 峰间调拨弹窗 */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="峰间灵石调拨"
      >
        <div className="space-y-4">
          {transferError && (
            <div className="text-red-600 text-sm px-3 py-2 bg-red-50 rounded-lg">
              {transferError}
            </div>
          )}
          {transferFromPeak && (
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: "rgba(124, 58, 237, 0.08)",
                border: "1px solid rgba(124, 58, 237, 0.15)",
              }}
            >
              <div className="text-sm font-shan" style={{ color: "#4C1D95" }}>
                源峰：{transferFromPeak.peakName}
              </div>
              <div className="text-xs mt-1" style={{ color: "#5a7a6a" }}>
                源峰可支配：{transferFromPeak.availableLingshi.toLocaleString()}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              目标峰 <span className="text-red-500">*</span>
            </label>
            <select
              value={transferToPeak?.peakId || ""}
              onChange={(e) => {
                const peak = peaksData.find((p) => p.peakId === parseInt(e.target.value));
                setTransferToPeak(peak || null);
              }}
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              style={{ borderColor: "rgba(15, 118, 110, 0.2)" }}
            >
              <option value="">请选择目标峰</option>
              {peaksData
                .filter((p) => p.peakId !== transferFromPeak?.peakId)
                .map((p) => (
                  <option key={p.peakId} value={p.peakId}>
                    {p.peakName}（可支配：{p.availableLingshi}）
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              调拨金额 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={transferAmount}
              onChange={(e) => setTransferAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              style={{ borderColor: "rgba(15, 118, 110, 0.2)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              调拨原因
            </label>
            <textarea
              value={transferRemark}
              onChange={(e) => setTransferRemark(e.target.value)}
              rows={2}
              placeholder="请输入调拨原因..."
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
              style={{ borderColor: "rgba(15, 118, 110, 0.2)" }}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowTransferModal(false)}
              className="flex-1 px-4 py-2.5 border text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              style={{ borderColor: "rgba(124, 58, 237, 0.3)" }}
            >
              取消
            </button>
            <button
              onClick={handleTransferSubmit}
              disabled={transferSubmitting}
              className="flex-1 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all font-medium disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)" }}
            >
              {transferSubmitting ? "调拨中..." : "确认调拨"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 总可支配灵石调整弹窗（增加 / 减少） */}
      <Modal
        isOpen={showAdjustTotalModal}
        onClose={() => setShowAdjustTotalModal(false)}
        title="调整总可支配灵石"
      >
        <div className="space-y-4">
          {adjustTotalError && (
            <div className="text-red-600 text-sm px-3 py-2 bg-red-50 rounded-lg">
              {adjustTotalError}
            </div>
          )}
          {/* 当前总可支配灵石信息卡片 */}
          <div
            className="rounded-lg p-3"
            style={{
              backgroundColor: "rgba(15, 118, 110, 0.08)",
              border: "1px solid rgba(15, 118, 110, 0.15)",
            }}
          >
            <div className="text-sm font-shan" style={{ color: "#1a4a3a" }}>
              当前总可支配灵石
            </div>
            <div className="text-2xl font-bold font-shan mt-1" style={{ color: "#0D9488" }}>
              {totalDisposable.toLocaleString()}
            </div>
            <div className="text-xs mt-1" style={{ color: "#5a7a6a" }}>
              宗门公共可自由支配灵石 · 调整后将记录到灵石收支
            </div>
          </div>

          {/* 调整类型选择（增加 / 减少） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              调整类型 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setAdjustTotalType("in")}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all font-shan"
                style={{
                  backgroundColor: adjustTotalType === "in" ? "#059669" : "rgba(255,255,255,0.5)",
                  color: adjustTotalType === "in" ? "#fff" : "#5a7a6a",
                  border: adjustTotalType === "in" ? "none" : "1px solid rgba(5,150,105,0.2)",
                }}
              >
                增加灵石
              </button>
              <button
                onClick={() => setAdjustTotalType("out")}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all font-shan"
                style={{
                  backgroundColor: adjustTotalType === "out" ? "#dc2626" : "rgba(255,255,255,0.5)",
                  color: adjustTotalType === "out" ? "#fff" : "#5a7a6a",
                  border: adjustTotalType === "out" ? "none" : "1px solid rgba(220,38,38,0.2)",
                }}
              >
                减少灵石
              </button>
            </div>
          </div>

          {/* 调整金额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              调整金额 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={adjustTotalType === "out" ? totalDisposable : undefined}
              value={adjustTotalAmount}
              onChange={(e) => setAdjustTotalAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              style={{ borderColor: "rgba(15, 118, 110, 0.2)" }}
            />
            {adjustTotalType === "out" && (
              <div className="text-xs mt-1" style={{ color: "#92400e" }}>
                最多可减少：{totalDisposable.toLocaleString()}
              </div>
            )}
          </div>

          {/* 调整原因 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              调整原因
            </label>
            <textarea
              value={adjustTotalRemark}
              onChange={(e) => setAdjustTotalRemark(e.target.value)}
              rows={3}
              placeholder="请输入调整原因（将记录到灵石收支）..."
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
              style={{ borderColor: "rgba(15, 118, 110, 0.2)" }}
            />
          </div>

          {/* 取消 / 确认按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAdjustTotalModal(false)}
              className="flex-1 px-4 py-2.5 border text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              style={{ borderColor: "rgba(15, 118, 110, 0.3)" }}
            >
              取消
            </button>
            <button
              onClick={handleAdjustTotalSubmit}
              disabled={adjustTotalSubmitting}
              className="flex-1 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all font-medium disabled:opacity-50"
              style={{
                background: adjustTotalType === "in"
                  ? "linear-gradient(135deg, #059669 0%, #10B981 100%)"
                  : "linear-gradient(135deg, #dc2626 0%, #EF4444 100%)",
              }}
            >
              {adjustTotalSubmitting ? "调整中..." : `确认${adjustTotalType === "in" ? "增加" : "减少"}`}
            </button>
          </div>
        </div>
      </Modal>

      {/* 峰灵石退回弹窗（峰 → 总库） */}
      <Modal
        isOpen={showReturnPeakModal}
        onClose={() => setShowReturnPeakModal(false)}
        title="峰灵石退回（峰 → 总库）"
      >
        <div className="space-y-4">
          {returnPeakError && (
            <div className="text-red-600 text-sm px-3 py-2 bg-red-50 rounded-lg">
              {returnPeakError}
            </div>
          )}
          {/* 当前峰灵石信息卡片 */}
          <div
            className="rounded-lg p-3"
            style={{
              backgroundColor: "rgba(146, 64, 14, 0.08)",
              border: "1px solid rgba(146, 64, 14, 0.15)",
            }}
          >
            <div className="text-sm font-shan" style={{ color: "#92400e" }}>
              {currentPeakName || "当前峰"} · 可支配灵石
            </div>
            <div className="text-2xl font-bold font-shan mt-1" style={{ color: "#b45309" }}>
              {currentPeakDisposable.toLocaleString()}
            </div>
            <div className="text-xs mt-1" style={{ color: "#5a7a6a" }}>
              将从此峰扣除灵石，退回至宗门总可支配灵石
            </div>
          </div>

          {/* 退回金额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              退回金额 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={currentPeakDisposable}
              value={returnPeakAmount}
              onChange={(e) => setReturnPeakAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              style={{ borderColor: "rgba(15, 118, 110, 0.2)" }}
            />
            <div className="text-xs mt-1" style={{ color: "#92400e" }}>
              最多可退回：{currentPeakDisposable.toLocaleString()}
            </div>
          </div>

          {/* 退回原因 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              退回原因
            </label>
            <textarea
              value={returnPeakRemark}
              onChange={(e) => setReturnPeakRemark(e.target.value)}
              rows={3}
              placeholder="请输入退回原因（将记录到灵石收支）..."
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
              style={{ borderColor: "rgba(15, 118, 110, 0.2)" }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowReturnPeakModal(false)}
              className="flex-1 px-4 py-2.5 border text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              style={{ borderColor: "rgba(146, 64, 14, 0.3)" }}
            >
              取消
            </button>
            <button
              onClick={handleReturnPeakSubmit}
              disabled={returnPeakSubmitting}
              className="flex-1 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all font-medium disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #92400e 0%, #b45309 100%)",
              }}
            >
              {returnPeakSubmitting ? "退回中..." : "确认退回"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 峰灵石分配到个人弹窗（峰 → 弟子，含二次确认） */}
      <Modal
        isOpen={showAllocateMemberModal}
        onClose={() => setShowAllocateMemberModal(false)}
        title="峰灵石分配（峰 → 弟子）"
      >
        <div className="space-y-4">
          {allocateMemberError && (
            <div className="text-red-600 text-sm px-3 py-2 bg-red-50 rounded-lg">
              {allocateMemberError}
            </div>
          )}
          {/* 弟子信息卡片 */}
          {allocatingMember && (
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: "rgba(15, 118, 110, 0.08)",
                border: "1px solid rgba(15, 118, 110, 0.15)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-shan" style={{ color: "#1a4a3a" }}>
                    目标弟子：{allocatingMember.name}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "#5a7a6a" }}>
                    当前灵石：{allocatingMember.lingshi.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-shan" style={{ color: "#5a7a6a" }}>峰可支配</div>
                  <div className="text-sm font-bold" style={{ color: "#92400e" }}>
                    {currentPeakDisposable.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 分配金额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分配金额 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={currentPeakDisposable}
              value={allocateMemberAmount}
              onChange={(e) => {
                setAllocateMemberAmount(parseInt(e.target.value) || 0);
                setAllocateMemberConfirmed(false);
              }}
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              style={{ borderColor: "rgba(15, 118, 110, 0.2)" }}
            />
            <div className="text-xs mt-1" style={{ color: "#92400e" }}>
              最多可分配：{currentPeakDisposable.toLocaleString()}
            </div>
          </div>
          {/* 分配原因 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分配原因
            </label>
            <textarea
              value={allocateMemberRemark}
              onChange={(e) => setAllocateMemberRemark(e.target.value)}
              rows={2}
              placeholder="请输入分配原因（将记录到灵石收支）..."
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
              style={{ borderColor: "rgba(15, 118, 110, 0.2)" }}
            />
          </div>
          {/* 二次确认 */}
          <div
            className="rounded-lg p-3 flex items-center gap-3"
            style={{
              backgroundColor: allocateMemberConfirmed ? "rgba(5, 150, 105, 0.08)" : "rgba(254, 243, 199, 0.5)",
              border: `1px solid ${allocateMemberConfirmed ? "rgba(5, 150, 105, 0.2)" : "rgba(251, 191, 36, 0.3)"}`,
            }}
          >
            <input
              type="checkbox"
              checked={allocateMemberConfirmed}
              onChange={(e) => setAllocateMemberConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <label className="text-sm cursor-pointer" style={{ color: allocateMemberConfirmed ? "#059669" : "#92400e" }}>
              我已确认将 {allocateMemberAmount} 灵石从峰分配给 {allocatingMember?.name}
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAllocateMemberModal(false)}
              className="flex-1 px-4 py-2.5 border text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              style={{ borderColor: "rgba(15, 118, 110, 0.3)" }}
            >
              取消
            </button>
            <button
              onClick={handleAllocateMemberSubmit}
              disabled={allocateMemberSubmitting || !allocateMemberConfirmed}
              className="flex-1 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)" }}
            >
              {allocateMemberSubmitting ? "分配中..." : "确认分配"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 更多详情弹窗：展示全部灵石收支记录（深褐色风格，金色文字） */}
      <AllAdjustmentsModal
        isOpen={showAllAdjustments}
        onClose={() => setShowAllAdjustments(false)}
        adjustments={adjustments}
      />

      {/* 财务专用计算器（收纳为左下角圆形按钮） */}
      {(canViewAll || canViewOwnPeak) && <Calculator />}

      {/* Toast 提示 */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white font-medium z-50 font-shan ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
          style={{
            backdropFilter: "blur(8px)",
            boxShadow: toast.type === "success"
              ? "0 10px 25px -5px rgba(16, 185, 129, 0.4)"
              : "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
