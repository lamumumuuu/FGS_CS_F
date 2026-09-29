// components/TaskDetail.tsx

/**
 * 任务详情组件（最终版）
 * 
 * 布局说明：
 * - 整体卡片：静态双色渐变背景，无发光效果。
 * - 上部：左侧为标签行、标题、信息行；右侧为灵石卡片（与上部等高）。
 * - 分割线（边框色#ddc899，加粗）。
 * - 中部左侧：描述（📜 悬赏描述）无边框，技术需求（⚙️ 技术需求）标题在上，内容以纯文本显示。
 * - 中部右侧：两个独立卡片
 *   - 卡片1（任务状态卡片）：顶部标题“任务状态”，下方任务状态标签。
 *   - 卡片2（勇者/完成卡片）：显示当前勇者或已完成信息（头像+用户名+状态文字）。
 * - 分割线（边框色#ddc899，加粗）。
 * - 底部：根据任务状态和当前用户角色动态显示操作按钮或信息。
 *   - 等待中：显示“接受委托”按钮。
 *   - 讨伐中且当前用户是接受者：显示“提交悬赏”按钮。
 *   - 讨伐中且接受者为其他用户：仅显示接受者信息，无按钮。
 *   - 已完成：仅显示完成信息，无按钮。
 * - 提交悬赏弹窗：与发布页面风格一致。
 * - 所有边框颜色统一为 #ddc899。
 */

"use client";

import { useState } from "react";
import { Task } from "@/types/task";
import { usePermission } from "@/contexts/PermissionContext";
import { QUEST_PERMISSIONS } from "@/types/permissions";
import { taskApi } from "@/app/api/client";

interface TaskDetailProps {
  task: Task;
  onBack: () => void;
  onAccept?: () => void;
  onSubmit?: (description: string, attachmentUrl: string) => void;
  onUpdateTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onForceClose?: (taskId: string) => void;
}

const difficultyStyles: Record<string, string> = {
  "黑铁": "bg-gray-800/60 text-gray-200",
  "青铜": "bg-amber-800/60 text-amber-200",
  "白银": "bg-slate-500/60 text-slate-100",
  "黄金": "bg-yellow-600/60 text-yellow-100",
};

const statusStyles: Record<string, string> = {
  "等待中": "border-blue-500 text-blue-500 border-2",
  "讨伐中": "border-red-500 text-red-500 border-2",
  "已提交": "border-amber-500 text-amber-500 border-2",
  "已完成": "border-green-500 text-green-500 border-2",
  "审核中": "border-yellow-500 text-yellow-500 border-2",
  "已驳回": "border-red-400 text-red-400 border-2",
  "已结束": "border-gray-500 text-gray-500 border-2",
};

export default function TaskDetail({ task, onBack, onAccept, onUpdateTask, onDeleteTask, onEditTask, onForceClose }: TaskDetailProps) {
  const { user, hasPermission } = usePermission();
  const currentUserId = user?.id ? String(user.id) : undefined;

  // 权限检查：接取任务需要 QUEST_PERMISSIONS.ACCEPT，提交任务需要 QUEST_PERMISSIONS.SUBMIT
  const canAccept = task.status === "等待中" && hasPermission(QUEST_PERMISSIONS.ACCEPT);
  const isCompleted = task.status === "已完成";
  const isTakenByMe = task.completer && currentUserId && String(task.completer.id) === currentUserId;
  const canSubmit = task.status === "讨伐中" && isTakenByMe && hasPermission(QUEST_PERMISSIONS.SUBMIT);

  // 编辑、删除、强制结项权限
  const canEditTask = hasPermission(QUEST_PERMISSIONS.EDIT_ANY) || hasPermission(QUEST_PERMISSIONS.EDIT_OWN_PEAK);
  const canDeleteTask = hasPermission(QUEST_PERMISSIONS.DELETE_ANY) || hasPermission(QUEST_PERMISSIONS.DELETE_OWN_PEAK);
  const canForceClose = hasPermission(QUEST_PERMISSIONS.FORCE_CLOSE);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitDescription, setSubmitDescription] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmitClick() {
    if (!submitDescription.trim()) {
      alert("请填写提交描述");
      return;
    }
    setSubmitting(true);
    try {
      const updatedTask = await taskApi.submitTask(task.id, submitDescription, attachmentUrl);
      if (onUpdateTask) {
        onUpdateTask(updatedTask);
      }
      alert("任务提交成功！等待核查验收");
      setShowSubmitModal(false);
      setSubmitDescription("");
      setAttachmentUrl("");
    } catch (error) {
      console.error("提交任务失败:", error);
      alert(error instanceof Error ? error.message : "提交任务失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-[#d4a574] hover:text-amber-300 font-medium transition-colors"
      >
        <span>←</span>
        <span>返回任务大厅</span>
      </button>

      {/* 详情卡片 */}
      <div className="rounded-xl bg-gradient-to-br from-[#edddbc] to-[#dcc89a] shadow-md p-8">

        {/* ========== 上部：基本信息 + 灵石卡片（等高） ========== */}
        <div className="flex items-stretch justify-between mb-6 pb-6 border-b-2 border-[#ddc899]">
          {/* 左侧文本区域 */}
          <div className="flex-1 flex flex-col justify-between mr-4">
            {/* 标签行 */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-4 py-1.5 rounded-lg text-sm font-bold ${difficultyStyles[task.difficulty] || "bg-gray-500/60 text-white"}`}>
                {task.difficulty}
              </span>
              <span className={`px-4 py-1.5 rounded-lg text-sm font-medium bg-transparent ${statusStyles[task.status] || "border-gray-400 text-gray-400 border-2"}`}>
                {task.status}
              </span>
              <span className="px-3 py-1.5 bg-amber-100/60 text-amber-800 rounded-lg text-sm">
                {task.publisher?.name ?? "未知峰"}
              </span>
            </div>

            {/* 标题 */}
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{task.title}</h1>

            {/* 信息行 */}
            <div className="flex items-center gap-6 text-sm text-gray-700">
              <span>发布者：{task.publisher?.name || "未知"}</span>
              <span>发布时间：{task.createdAt}</span>
              <span>截止日期：{task.deadline || "无"}</span>
            </div>
          </div>

          {/* 右侧灵石卡片（与左侧等高） */}
          <div className="flex flex-col items-center justify-center bg-[#dec99b] border border-[#ddc899] rounded-lg px-4 py-2 self-stretch">
            <span className="text-2xl">💎</span>
            <span className="text-3xl font-bold text-amber-700">{task.reward}</span>
            <span className="text-sm text-gray-600">灵石</span>
          </div>
        </div>

        {/* ========== 中部：描述/技术需求 + 状态/勇者 ========== */}
        <div className="mb-6 pb-6 border-b-2 border-[#ddc899]">
          <div className="flex gap-6">
            {/* 左侧：描述（无边框），技术需求（标题在外面，内容以纯文本显示） */}
            <div className="flex-1 space-y-6">
              {/* 📜 悬赏描述 */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">
                  📜 悬赏描述
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>

              {/* ⚙️ 技术需求 */}
              {task.techRequirements && task.techRequirements.length > 0 && (
                <>
                  <h2 className="text-lg font-bold text-gray-800 mb-3">
                    ⚙️ 技术需求
                  </h2>
                  <div className="border border-[#ddc899] rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {task.techRequirements.join("，")}
                    </p>
                  </div>
                </>
              )}

              {/* 🎯 提交成果（已提交或已完成且存在提交内容时展示） */}
              {(task.status === "已提交" || task.status === "已完成") && task.submissionDescription && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-3">
                    🎯 提交成果
                  </h2>
                  <div className="border border-[#ddc899] rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {task.submissionDescription}
                    </p>
                    {task.attachmentUrl && (
                      <a
                        href={task.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-blue-600 hover:underline break-all"
                      >
                        🔗 {task.attachmentUrl}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 右侧：状态卡片区 */}
            <div className="w-48 flex flex-col gap-4">
              {/* 任务状态卡片 */}
              <div className="border border-[#ddc899] rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">任务状态</h3>
                <span className={`inline-block px-4 py-1.5 rounded-lg text-sm font-medium bg-transparent ${statusStyles[task.status] || "border-gray-400 text-gray-400 border-2"}`}>
                  {task.status}
                </span>
              </div>

              {/* 勇者/完成信息卡片（仅在非等待中且有相关数据时显示） */}
              {(task.completer || isCompleted) && (
                <div className="border border-[#ddc899] rounded-lg p-3">
                  {isCompleted ? (
                    <>
                      <p className="text-sm font-medium text-gray-800 mb-2">已完成：</p>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-xl">
                          👤
                        </div>
                        <span className="text-sm text-gray-800">{task.completer?.name || "未知"}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {task.reviewedAt ? `${task.reviewedAt} 完成` : "已完成"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-800 mb-2">当前勇者：</p>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-xl">
                          👤
                        </div>
                        <span className="text-sm text-gray-800">{task.completer!.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">已接取任务</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== 底部：操作按钮（根据状态和用户角色动态显示/隐藏） ========== */}
        <div className="pt-2 text-center">
          <div className="flex flex-wrap justify-center gap-3">
            {canAccept && (
              <button
                onClick={onAccept}
                className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold rounded-lg hover:from-amber-700 hover:to-amber-600 transition-all active:scale-95"
              >
                接受委托
              </button>
            )}
            {canSubmit && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all active:scale-95"
              >
                提交悬赏
              </button>
            )}
            {canEditTask && task.status !== "已完成" && (
              <button
                onClick={() => onEditTask?.(task)}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all active:scale-95"
              >
                ✏️ 编辑任务
              </button>
            )}
            {canDeleteTask && (
              <button
                onClick={() => {
                  if (confirm(`确定要删除任务 "${task.title}" 吗？此操作不可撤销。`)) {
                    onDeleteTask?.(task.id);
                  }
                }}
                className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all active:scale-95"
              >
                🗑️ 删除任务
              </button>
            )}
            {canForceClose && task.status !== "已完成" && task.status !== "已驳回" && (
              <button
                onClick={() => {
                  const reason = prompt("请输入强制结项的原因：");
                  if (reason !== null) {
                    onForceClose?.(task.id);
                  }
                }}
                className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-all active:scale-95"
              >
                ⚠️ 强制结项
              </button>
            )}
          </div>
          {isCompleted && (
            <div className="text-green-700 font-bold text-lg mt-4">
              已完成 —— {task.completer?.name || "未知用户"}
            </div>
          )}
          {/* 已提交：提示勇者成果已提交，等待审核验收 */}
          {task.status === "已提交" && (
            <div className="text-amber-700 font-semibold text-base mt-4">
              ✅ 成果已提交，等待审核验收
            </div>
          )}
          {/* 被他人接取时仅显示接受者信息，不显示任何按钮 */}
          {task.completer && !isTakenByMe && !isCompleted && (
            <div className="text-gray-700 mt-4">
              接受者：{task.completer.name}
            </div>
          )}
        </div>
      </div>

      {/* 提交悬赏弹窗 */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-xl bg-[#f2e2c1] shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-[#2d1f10] mb-6 text-center">
              📤 提交悬赏
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#2d1f10] mb-2">
                  提交描述
                </label>
                <textarea
                  value={submitDescription}
                  onChange={(e) => setSubmitDescription(e.target.value)}
                  placeholder="请描述你的完成情况..."
                  rows={4}
                  className="w-full px-4 py-3 border border-[#ddc899] rounded-lg bg-[#ecdbb5] text-[#2d1f10] placeholder-[#6b5740] resize-none focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2d1f10] mb-2">
                  附件链接
                </label>
                <input
                  type="text"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="可选的附件链接..."
                  className="w-full px-4 py-3 border border-[#ddc899] rounded-lg bg-[#ecdbb5] text-[#2d1f10] placeholder-[#6b5740] focus:outline-none transition-all"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 border border-[#ddc899] text-gray-700 font-medium rounded-lg bg-transparent hover:bg-gray-100 transition-all"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitClick}
                  className="flex-1 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? "提交中..." : "提交"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}