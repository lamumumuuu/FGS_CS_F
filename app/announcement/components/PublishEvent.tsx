// app/announcement/components/PublishEvent.tsx

/**
 * 发布活动弹窗（独立组件，横向三步式）
 *
 * 三步横向布局：
 * - 第一步：活动信息（名称、描述、地点、类型）
 * - 第二步：活动时间（开始时间、结束时间，使用 TimeWheelPicker）
 * - 第三步：其他设置（人数上限） + 操作按钮（删除/结束/取消/提交）
 *
 * 使用全局 Modal 作为外壳，xl 宽度以容纳横向内容。
 */

"use client";

import { useState, useRef } from "react";
import Modal from "@/components/Modal";
import type { CreateEventRequest, Event } from "@/app/api/client/modules/event";
import { getDefaultStartTime, getMinDateTime } from "./constants";
import TimeWheelPicker from "./TimeWheelPicker";

interface PublishEventProps {
  isOpen: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  formError: string;
  submitting: boolean;
  /** 活动表单数据 */
  form: CreateEventRequest;
  onFormChange: (form: CreateEventRequest) => void;
  /** 正在编辑的活动（为 null 表示新建模式） */
  editingEvent: Event | null;
  /** 人数上限开关状态 */
  maxParticipantsEnabled: boolean;
  onToggleMaxParticipants: () => void;
  /** 权限标记 */
  canCreateEvent: boolean;
  canManageOwnPeak: boolean;
  canManageAllEvents: boolean;
  /** 删除活动回调（编辑模式可用） */
  onDelete?: (event: Event) => void;
  /** 结束活动回调（编辑模式、进行中活动可用） */
  onEnd?: (event: Event) => void;
}

/** 步骤定义 */
const STEPS = [
  { key: "info", label: "活动信息", num: 1 },
  { key: "time", label: "活动时间", num: 2 },
  { key: "other", label: "其他设置", num: 3 },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export default function PublishEvent({
  isOpen,
  onSubmit,
  onCancel,
  formError,
  submitting,
  form,
  onFormChange,
  editingEvent,
  maxParticipantsEnabled,
  onToggleMaxParticipants,
  canCreateEvent,
  canManageOwnPeak,
  canManageAllEvents,
  onDelete,
  onEnd,
}: PublishEventProps) {
  const [currentStep, setCurrentStep] = useState<StepKey>("info");
  const descRef = useRef<HTMLTextAreaElement>(null);

  // 弹窗关闭时重置步骤
  const handleClose = () => {
    setCurrentStep("info");
    onCancel();
  };

  const title = editingEvent ? "编辑活动" : "创建活动";

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const goNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].key);
    }
  };

  const goPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].key);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="xl"
      containerStyle={{ backgroundColor: "#f2e2c1", maxWidth: "800px" }}
    >
      <div className="space-y-6">
        {/* 错误提示 */}
        {formError && (
          <div className="p-3 bg-red-50 border border-red-400 rounded-lg text-red-600 text-sm">
            {formError}
          </div>
        )}

        {/* ============================================================ */}
        {/* 步骤指示器                                                    */}
        {/* ============================================================ */}
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((step, idx) => (
            <div key={step.key} className="flex items-center">
              {/* 步骤圆点 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    idx <= currentStepIndex
                      ? "bg-amber-700 text-white shadow-md"
                      : "bg-[#ecdbb5] text-[#6b5740] border border-[#3d2b1f]"
                  }`}
                >
                  {step.num}
                </div>
                <span
                  className={`text-xs mt-1 font-medium whitespace-nowrap ${
                    idx <= currentStepIndex ? "text-[#2d1f10]" : "text-[#6b5740]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {/* 连接线 */}
              {idx < STEPS.length - 1 && (
                <div
                  className="w-16 sm:w-24 h-0.5 mx-1 mt-[-16px] transition-all"
                  style={{
                    backgroundColor: idx < currentStepIndex ? "#b94c00" : "#d4c4a0",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* 第一步：活动信息                                                 */}
        {/* ============================================================ */}
        {currentStep === "info" && (
          <div className="space-y-4">
            {/* 活动名称 */}
            <div>
              <label className="block text-sm font-medium text-[#2d1f10] mb-1">
                活动名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                placeholder="请输入活动名称"
                className="w-full px-4 py-2.5 border border-[#3d2b1f] rounded-lg bg-[#ecdbb5] text-[#2d1f10] placeholder-[#6b5740] focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                maxLength={100}
              />
            </div>

            {/* 活动描述 */}
            <div>
              <label className="block text-sm font-medium text-[#2d1f10] mb-1">活动描述</label>
              <textarea
  ref={descRef}
  value={form.description}
  onChange={(e) => {
    onFormChange({ ...form, description: e.target.value });
    if (descRef.current) {
      descRef.current.style.height = "auto";
      descRef.current.style.height = descRef.current.scrollHeight + "px";
    }
  }}
  rows={3}
  placeholder="请输入活动描述..."
  className="w-full px-4 py-2.5 border border-[#3d2b1f] rounded-lg bg-[#ecdbb5] text-[#2d1f10] placeholder-[#6b5740] focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none overflow-hidden"
  style={{ minHeight: "120px" }}
/>
            </div>

            {/* 活动地点 */}
            <div>
              <label className="block text-sm font-medium text-[#2d1f10] mb-1">活动地点</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => onFormChange({ ...form, location: e.target.value })}
                placeholder="请输入活动地点"
                className="w-full px-4 py-2.5 border border-[#3d2b1f] rounded-lg bg-[#ecdbb5] text-[#2d1f10] placeholder-[#6b5740] focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            {/* 类型选择 */}
            <div>
              <label className="block text-sm font-medium text-[#2d1f10] mb-2">活动类型</label>
              <div className="flex gap-3">
                {canCreateEvent && (
                  <button
                    type="button"
                    onClick={() => onFormChange({ ...form, type: "global" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      form.type === "global"
                        ? "bg-amber-700 text-white"
                        : "bg-[#ecdbb5] text-[#6b5740] border border-[#3d2b1f]"
                    }`}
                  >
                    宗门活动
                  </button>
                )}
                {(canManageOwnPeak || canManageAllEvents) && (
                  <button
                    type="button"
                    onClick={() => onFormChange({ ...form, type: "peak" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      form.type === "peak"
                        ? "bg-amber-700 text-white"
                        : "bg-[#ecdbb5] text-[#6b5740] border border-[#3d2b1f]"
                    }`}
                  >
                    本峰活动
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 第二步：活动时间                                                 */}
        {/* ============================================================ */}
        {currentStep === "time" && (
          <div className="space-y-4">
            <TimeWheelPicker
              label="开始时间"
              value={form.startTime || getDefaultStartTime()}
              onChange={(val) => onFormChange({ ...form, startTime: val })}
              min={getMinDateTime()}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-[#2d1f10]">结束时间</label>
                <label className="flex items-center gap-1 text-xs text-[#6b5740] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!form.endTime}
                    onChange={(e) =>
                      onFormChange({
                        ...form,
                        endTime: e.target.checked ? "" : (form.startTime || getDefaultStartTime()),
                      })
                    }
                    className="accent-amber-600"
                  />
                  不限
                </label>
              </div>
              {form.endTime && (
                <TimeWheelPicker
                  value={form.endTime}
                  onChange={(val) => onFormChange({ ...form, endTime: val })}
                  min={form.startTime || getMinDateTime()}
                />
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 第三步：其他设置 + 操作按钮                                      */}
        {/* ============================================================ */}
        {currentStep === "other" && (
          <div className="space-y-6">
            {/* 人数上限开关 */}
            <div>
              <label className="block text-sm font-medium text-[#2d1f10] mb-1">参与人数上限</label>
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={onToggleMaxParticipants}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    maxParticipantsEnabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      maxParticipantsEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-[#2d1f10]">限制人数</span>
              </div>
              {maxParticipantsEnabled && (
                <input
                  type="number"
                  min={1}
                  value={form.maxParticipants ?? 50}
                  onChange={(e) =>
                    onFormChange({
                      ...form,
                      maxParticipants: parseInt(e.target.value) || 50,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-[#3d2b1f] rounded-lg bg-[#ecdbb5] text-[#2d1f10] focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4 border-t border-gray-400">
              {editingEvent && (
                <button
                  type="button"
                  onClick={() => {
                    const evt = editingEvent;
                    if (evt && confirm(`确定要删除活动「${evt.name}」吗？此操作不可撤销。`)) {
                      onDelete?.(evt);
                    }
                  }}
                  className="px-4 py-2.5 text-red-600 border border-red-400 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
                >
                  删除活动
                </button>
              )}
              {editingEvent &&
                editingEvent.status !== "completed" &&
                editingEvent.status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => {
                      const evt = editingEvent;
                      if (evt && confirm(`确定要结束活动「${evt.name}」吗？结束后将无法再编辑。`)) {
                        onEnd?.(evt);
                      }
                    }}
                    className="px-4 py-2.5 text-orange-600 border border-orange-400 rounded-lg hover:bg-orange-50 transition-colors font-medium text-sm"
                  >
                    结束活动
                  </button>
                )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 底部导航按钮（上一步 / 下一步 / 取消 / 提交）                    */}
        {/* ============================================================ */}
        <div className="flex gap-3 pt-4 border-t border-gray-400">
          {!isFirstStep && (
            <button
              type="button"
              onClick={goPrev}
              className="px-4 py-2.5 border border-[#3d2b1f] text-[#2d1f10] rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
            >
              ← 上一步
            </button>
          )}
          {!isLastStep ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 px-4 py-2.5 text-white rounded-lg transition-all font-medium bg-amber-700 hover:bg-amber-800"
            >
              下一步 →
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-[#3d2b1f] text-[#2d1f10] rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                取消
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 text-white rounded-lg transition-all font-medium disabled:opacity-50 bg-amber-700 hover:bg-amber-800"
              >
                {submitting
                  ? editingEvent
                    ? "更新中..."
                    : "创建中..."
                  : editingEvent
                    ? "保存修改"
                    : "创建活动"}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}