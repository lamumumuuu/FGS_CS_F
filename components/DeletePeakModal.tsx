"use client";

import React, { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { sectApi } from "@/app/api/client";

interface PeakInfo {
  id?: string;
  name: string;
  description?: string;
  memberCount?: number;
}

interface DeletePeakModalProps {
  isOpen: boolean;
  peak: PeakInfo | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 删除山峰 Modal 组件
 *
 * 功能说明：
 * - 从宗门中移除指定山峰，同时释放该峰所有弟子的峰关联
 * - 移除用户与该峰的关联（user_peak 表记录）
 * - 重置该峰用户的全局权限（ROLE_PEAK_ADMIN -> ROLE_USER）
 *
 * 前置条件：
 * - 仅"协会核心成员"及以上角色可操作
 * - 财务特殊峰 _TREASURY_ 不可删除
 * - 系统峰 "管理台" 不可删除
 * - 删除前需确认，操作不可撤销
 */
const DeletePeakModal: React.FC<DeletePeakModalProps> = ({
  isOpen,
  peak,
  onClose,
  onSuccess,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"confirm" | "verify">("confirm");
  const { showToast } = useToast();

  if (!isOpen || !peak) return null;

  /** 检查是否为受保护的山峰 */
  const PEAK_PROTECTED = peak.name === "_TREASURY_" || peak.name === "管理台";

  /** 确认文本 */
  const CONFIRM_PHRASE = `确认删除峰"${peak.name}"`;

  /** 点击确认删除 */
  const handleDelete = async () => {
    if (PEAK_PROTECTED) {
      showToast(`山峰 "${peak.name}" 受系统保护，不可删除`, "error");
      return;
    }

    if (step === "confirm") {
      setStep("verify");
      return;
    }

    if (step === "verify") {
      if (confirmText !== CONFIRM_PHRASE) {
        setError(`请准确输入：${CONFIRM_PHRASE}`);
        return;
      }
      setError("");
    }

    setSubmitting(true);
    try {
      // 使用山峰 ID 调用后端删除接口
      if (!peak.id) {
        throw new Error("山峰数据异常：缺少山峰 ID");
      }
      await sectApi.deletePeak(peak.id);
      showToast(`山峰 "${peak.name}" 已删除，${peak.memberCount || 0} 名弟子已调整为无峰成员`, "success");
      onSuccess();
      onClose();
      resetState();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "删除失败";
      showToast(msg, "error");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /** 取消操作 */
  const handleCancel = () => {
    onClose();
    resetState();
  };

  /** 重置内部状态 */
  const resetState = () => {
    setConfirmText("");
    setError("");
    setStep("confirm");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* 弹窗主体 */}
      <div className="relative w-[90%] max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-red-700/40 shadow-2xl"
        style={{ background: "linear-gradient(135deg, #2d1f10 0%, #1d140b 100%)" }}
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-red-800/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-900/40 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-400">删除山峰</h2>
            <p className="text-xs text-amber-200/60 mt-0.5">
              此操作将移除山峰及其所有关联数据
            </p>
          </div>
        </div>

        {/* 内容区 */}
        <div className="px-6 py-5 space-y-4">
          {/* 山峰信息 */}
          <div className="rounded-xl bg-red-900/20 border border-red-700/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-amber-100 font-semibold text-lg">{peak.name}</div>
                {peak.description && (
                  <div className="text-amber-200/60 text-sm mt-1">{peak.description}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-400">
                  {peak.memberCount || 0}
                </div>
                <div className="text-xs text-amber-200/50">弟子</div>
              </div>
            </div>
          </div>

          {/* 风险提示 */}
          <div className="rounded-lg bg-amber-900/20 border border-amber-600/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-medium text-sm">
              <span>🔔</span>
              <span>此操作将执行以下变更，且不可撤销：</span>
            </div>
            <ul className="text-amber-200/70 text-sm space-y-1 ml-6 list-disc">
              <li>从数据库移除山峰记录（peak 表）</li>
              <li>
                该峰{" "}
                <span className="font-bold text-red-400">{peak.memberCount || 0}</span>{" "}
                名弟子的"所属山峰"字段将清空
              </li>
              <li>所有该峰管理员的权限将降级为普通成员</li>
              <li>用户-山峰关联（user_peak）记录将被移除</li>
            </ul>
          </div>

          {PEAK_PROTECTED && (
            <div className="rounded-lg bg-red-900/30 border border-red-500/40 p-4">
              <div className="flex items-center gap-2 text-red-300 font-medium text-sm">
                <span>🚫</span>
                <span>
                  山峰 "{peak.name}" 受系统保护，不允许删除
                </span>
              </div>
              <p className="text-red-200/70 text-xs mt-2">
                该山峰为系统功能所需（财务模块/管理台），请选择其他山峰进行删除操作
              </p>
            </div>
          )}

          {/* 验证步骤 */}
          {!PEAK_PROTECTED && step === "verify" && (
            <div className="rounded-lg bg-red-900/30 border border-red-500/40 p-4 space-y-2">
              <div className="text-red-200 text-sm font-medium flex items-center gap-2">
                <span>✍️</span>
                请在下方输入：
                <code className="px-2 py-0.5 rounded bg-red-800/50 text-red-200 font-mono text-xs">
                  {CONFIRM_PHRASE}
                </code>
              </div>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError("");
                }}
                placeholder="请输入确认文本"
                className="w-full px-3 py-2 rounded-lg bg-[#1d140b] border border-red-700/40 text-amber-100 placeholder-amber-200/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
              />
              {error && (
                <p className="text-red-400 text-xs">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 border-t border-red-800/40 flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-transparent border border-amber-700/40 text-amber-200 hover:bg-amber-900/20 transition-colors font-medium text-sm disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleDelete}
            disabled={submitting || PEAK_PROTECTED}
            className="px-5 py-2 rounded-lg font-medium text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: PEAK_PROTECTED
                ? "#4b3030"
                : "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
              boxShadow: PEAK_PROTECTED
                ? "none"
                : "0 4px 12px rgba(220, 38, 38, 0.3)",
            }}
          >
            {submitting ? "处理中..." : PEAK_PROTECTED ? "受保护" : step === "confirm" ? "下一步" : "确认删除"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePeakModal;
