// app/task-hall/review/page.tsx

/**
 * 任务大厅 - 审核页面（风格统一版）
 * 
 * 仅对拥有 quest:review 权限的用户可见，用于审核待发布的悬赏任务。
 * 卡片设计沿用 TaskCard 的风格：双色渐变背景、圆角、悬停发光。
 * 功能：
 * - 发布审核：查看待审核任务列表（状态为"审核中"），审核通过 / 拒绝任务
 * - 成果核查：查看已提交成果的任务（状态为"讨伐中"且已有完成者），验收通过
 * - 查看任务详情
 * - 查看审核历史记录
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Task, TaskDifficulty } from "@/types/task";
import { taskApi } from "@/app/api/client";
import { usePermission } from "@/contexts/PermissionContext";
import { QUEST_PERMISSIONS } from "@/types/permissions";
import Modal from "@/components/Modal";

interface ReviewRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  reviewerName: string;
  result: "approved" | "rejected";
  resultText: string;
  reason?: string;
  reviewedAt: string;
}

const difficultyStyles: Record<TaskDifficulty, string> = {
  黑铁: "bg-stone-200 text-stone-700 border border-stone-400",
  青铜: "bg-orange-100 text-orange-700 border border-orange-300",
  白银: "bg-gray-100 text-gray-700 border border-gray-300",
  黄金: "bg-yellow-100 text-yellow-700 border border-yellow-300",
};

// 统一卡片样式（与 TaskCard 完全一致）
const cardBaseClass =
  "rounded-xl border border-transparent bg-gradient-to-br from-[#edddbc] to-[#dcc89a] transition-all duration-300 " +
  "hover:shadow-[0_0_20px_rgba(237,221,188,0.6)] hover:border-[#dcc89a]/40";

export default function TaskReview() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, hasPermission } = usePermission();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [reviewHistory, setReviewHistory] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  // Tab 类型：publish=发布审核，verify=成果核查，history=审核历史记录
  const [activeTab, setActiveTab] = useState<"publish" | "verify" | "history">("publish");

  // 成果核查相关状态
  const [verifyTasks, setVerifyTasks] = useState<Task[]>([]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let ignore = false;

    async function fetchPendingTasks() {
      setLoading(true);
      setError("");
      try {
        const data = await taskApi.getPendingTasks();
        if (!ignore) setTasks(data);
      } catch (err) {
        console.error("Failed to load pending tasks:", err);
        if (!ignore) {
          setError(err instanceof Error ? err.message : "加载失败");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchPendingTasks();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  async function fetchReviewHistory() {
    setHistoryLoading(true);
    try {
      const allTasks = await taskApi.getTasks();
      const history: ReviewRecord[] = [];
      allTasks.forEach((task) => {
        if (task.status === "已完成" || task.status === "已驳回") {
          history.push({
            id: `history-${task.id}`,
            taskId: task.id,
            taskTitle: task.title,
            reviewerName: task.reviewedBy || "系统",
            result: task.status === "已完成" ? "approved" : "rejected",
            resultText: task.status === "已完成" ? "审核通过" : "审核驳回",
            reason: task.rejectReason,
            reviewedAt: task.reviewedAt || task.createdAt,
          });
        }
      });
      history.sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
      setReviewHistory(history);
    } catch (err) {
      console.error("Failed to load review history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleApprove(taskId: string) {
    // 前端权限校验：审核发布任务需要 QUEST_PERMISSIONS.REVIEW
    if (!hasPermission(QUEST_PERMISSIONS.REVIEW)) {
      showToastMessage("您没有审核任务的权限", "error");
      return;
    }
    if (!confirm("确定通过该悬赏任务吗？通过后任务将发布到任务大厅。")) return;

    setActionLoading(true);
    try {
      await taskApi.approveTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
        setShowDetailModal(false);
      }
      showToastMessage("审核通过成功", "success");
    } catch (err) {
      showToastMessage(err instanceof Error ? err.message : "审核失败", "error");
    } finally {
      setActionLoading(false);
    }
  }

  function handleRejectClick(task: Task) {
    // 前端权限校验：审核发布任务需要 QUEST_PERMISSIONS.REVIEW
    if (!hasPermission(QUEST_PERMISSIONS.REVIEW)) {
      showToastMessage("您没有拒绝任务的权限", "error");
      return;
    }
    setSelectedTask(task);
    setRejectReason("");
    setShowRejectModal(true);
  }

  async function handleConfirmReject() {
    if (!selectedTask) return;
    // 前端权限校验：审核发布任务需要 QUEST_PERMISSIONS.REVIEW
    if (!hasPermission(QUEST_PERMISSIONS.REVIEW)) {
      showToastMessage("您没有拒绝任务的权限", "error");
      return;
    }

    setActionLoading(true);
    try {
      await taskApi.rejectTask(selectedTask.id, rejectReason);
      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
      setShowRejectModal(false);
      if (showDetailModal) {
        setShowDetailModal(false);
      }
      setSelectedTask(null);
      setRejectReason("");
      showToastMessage("已拒绝该任务", "success");
    } catch (err) {
      showToastMessage(err instanceof Error ? err.message : "操作失败", "error");
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * 加载待核查成果列表
   * 筛选条件：状态为"已提交"的任务
   * 这些任务是勇者已接取并提交成果、等待核查验收
   */
  async function fetchVerifyTasks() {
    setVerifyLoading(true);
    setVerifyError("");
    try {
      const data = await taskApi.getTasks({ status: "已提交" });
      setVerifyTasks(data || []);
    } catch (err) {
      console.error("Failed to load verify tasks:", err);
      setVerifyError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setVerifyLoading(false);
    }
  }

  /**
   * 验收通过：调用 completeTask API 完成任务验收
   * 验收通过后奖励发放给完成者，任务状态变为"已完成"
   */
  async function handleComplete(taskId: string) {
    // 前端权限校验：核查验收需要 QUEST_PERMISSIONS.REVIEW
    if (!hasPermission(QUEST_PERMISSIONS.REVIEW)) {
      showToastMessage("您没有核查任务的权限", "error");
      return;
    }
    if (!confirm("确定验收通过吗？通过后奖励将发放给完成者。")) return;

    setActionLoading(true);
    try {
      await taskApi.completeTask(taskId);
      setVerifyTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToastMessage("任务验收通过，奖励已发放给完成者", "success");
    } catch (err) {
      showToastMessage(err instanceof Error ? err.message : "验收失败", "error");
    } finally {
      setActionLoading(false);
    }
  }

  function handleViewDetail(task: Task) {
    setSelectedTask(task);
    setShowDetailModal(true);
  }

  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "radial-gradient(ellipse at 30% 35%, #291b0f 0%, #1d140b 70%)",
        }}
      >
        <div className="text-white text-lg">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // 审核发布任务需要 QUEST_PERMISSIONS.REVIEW 权限
  const canReview = hasPermission(QUEST_PERMISSIONS.REVIEW);

  const pageBackgroundStyle: React.CSSProperties = {
    background: "radial-gradient(ellipse at 30% 35%, #291b0f 0%, #1d140b 70%)",
  };

  return (
    <div
      className="flex-1 py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-72px)]"
      style={pageBackgroundStyle}
    >
      <div className="max-w-6xl mx-auto">
        <Link
          href="/task-hall"
          onClick={(e) => { e.preventDefault(); router.push("/task-hall"); }}
          className="inline-flex items-center gap-2 text-white hover:text-gray-200 font-medium mb-6 transition-colors"
        >
          <span>←</span>
          <span>返回任务大厅</span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3 drop-shadow-lg font-shan" style={{ color: "#d4a574" }}>
            📋 任务审核
          </h1>
          <p className="text-medium font-shan" style={{ color: "#a07848" }}>
            审核待发布的悬赏任务，维护宗门秩序
          </p>
          {canReview && (
            <div className="mt-3 inline-flex items-center gap-4 px-4 py-1.5 bg-white/10 rounded-lg text-white text-sm">
              <span>📊 待审核：{tasks.length} 条</span>
              <span>🔍 待核查：{verifyTasks.length} 条</span>
            </div>
          )}
        </div>

        {/* ---------- 权限不足提示 ---------- */}
        {!canReview && (
          <div className={`${cardBaseClass} p-12`}>
            <div className="text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">权限不足</h2>
              <p className="text-gray-600">您没有审核任务的权限，请联系管理员获取授权</p>
              <Link
                href="/task-hall"
                onClick={(e) => { e.preventDefault(); router.push("/task-hall"); }}
                className="inline-block mt-6 px-6 py-2.5 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-all"
              >
                返回任务大厅
              </Link>
            </div>
          </div>
        )}

        {/* ---------- 错误提示 ---------- */}
        {error && canReview && (
          <div className="rounded-lg border border-red-300 p-4 mb-6 bg-red-50">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {canReview && (
          <>
            {/* ---------- Tab 切换 ---------- */}
            <div className="flex mb-6 border-b border-white/20">
              <button
                onClick={() => setActiveTab("publish")}
                className={`flex-1 px-6 py-3 font-medium text-center transition-colors ${activeTab === "publish"
                  ? "text-white border-b-2 border-white"
                  : "text-gray-300 hover:text-white"
                  }`}
              >
                ⏳ 发布审核
              </button>
              <button
                onClick={() => {
                  setActiveTab("verify");
                  fetchVerifyTasks();
                }}
                className={`flex-1 px-6 py-3 font-medium text-center transition-colors ${activeTab === "verify"
                  ? "text-white border-b-2 border-white"
                  : "text-gray-300 hover:text-white"
                  }`}
              >
                🔍 成果核查
              </button>
              <button
                onClick={() => {
                  setActiveTab("history");
                  fetchReviewHistory();
                }}
                className={`flex-1 px-6 py-3 font-medium text-center transition-colors ${activeTab === "history"
                  ? "text-white border-b-2 border-white"
                  : "text-gray-300 hover:text-white"
                  }`}
              >
                📜 审核历史记录
              </button>
            </div>

            {/* ---------- 发布审核：待审核任务列表 ---------- */}
            {activeTab === "publish" && (
              <>
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="text-white text-lg">加载中...</div>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className={`${cardBaseClass} p-12`}>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-800 mb-3">暂无待审核任务</h2>
                      <p className="text-gray-600">所有悬赏任务都已审核完毕</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div key={task.id} className={`${cardBaseClass} p-6`}>
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3
                                className="text-xl font-bold text-gray-800 cursor-pointer hover:text-amber-700 transition-colors"
                                onClick={() => handleViewDetail(task)}
                              >
                                {task.title}
                              </h3>
                              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${difficultyStyles[task.difficulty as TaskDifficulty]}`}>
                                {task.difficulty}
                              </span>
                              <span className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                审核中
                              </span>
                            </div>

                            <p className="text-gray-600 mb-3 line-clamp-2">{task.description}</p>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                💎 <span className="font-medium text-amber-700">{task.reward}</span> 灵石
                              </span>
                              <span>发布者：{task.publisher?.name || "未知"}</span>
                              <span>{task.createdAt}</span>
                              <button
                                onClick={() => handleViewDetail(task)}
                                className="text-amber-700 hover:text-amber-800 font-medium underline underline-offset-2"
                              >
                                查看详情 →
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-3 flex-shrink-0">
                            <button
                              onClick={() => handleApprove(task.id)}
                              disabled={actionLoading}
                              className="px-5 py-2 bg-green-700 text-white font-medium rounded-lg hover:bg-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✓ 通过
                            </button>
                            <button
                              onClick={() => handleRejectClick(task)}
                              disabled={actionLoading}
                              className="px-5 py-2 bg-red-700 text-white font-medium rounded-lg hover:bg-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✗ 拒绝
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ---------- 成果核查：待核查成果列表 ---------- */}
            {activeTab === "verify" && (
              <>
                {verifyError && (
                  <div className="rounded-lg border border-red-300 p-4 mb-6 bg-red-50">
                    <p className="text-red-600">{verifyError}</p>
                  </div>
                )}
                {verifyLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="text-white text-lg">加载中...</div>
                  </div>
                ) : verifyTasks.length === 0 ? (
                  <div className={`${cardBaseClass} p-12`}>
                    <div className="text-center">
                      <div className="text-5xl mb-4">🔍</div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-3">暂无待核查成果</h2>
                      <p className="text-gray-600">所有已提交的成果都已核查完毕</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verifyTasks.map((task) => (
                      <div key={task.id} className={`${cardBaseClass} p-6`}>
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-800">
                                {task.title}
                              </h3>
                              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${difficultyStyles[task.difficulty as TaskDifficulty]}`}>
                                {task.difficulty}
                              </span>
                              <span className="px-3 py-1 rounded-lg text-sm font-medium bg-red-100 text-red-700 border border-red-200">
                                已提交
                              </span>
                            </div>

                            {/* 完成者信息 */}
                            <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                              <span>完成者：</span>
                              <span className="font-medium text-gray-800">
                                {task.completer?.name || "未知"}
                              </span>
                            </div>

                            {/* 提交成果描述 */}
                            {task.submissionDescription ? (
                              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-xs font-semibold text-gray-600 mb-1">📝 提交描述：</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {task.submissionDescription}
                                </p>
                              </div>
                            ) : (
                              <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-500 italic">勇者尚未提交成果描述</p>
                              </div>
                            )}

                            {/* 附件链接 */}
                            {task.attachmentUrl && (
                              <div className="mb-3 text-sm text-gray-600">
                                <span>附件：</span>
                                <a
                                  href={task.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline break-all"
                                >
                                  {task.attachmentUrl}
                                </a>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                💎 <span className="font-medium text-amber-700">{task.reward}</span> 灵石
                              </span>
                              <span>发布者：{task.publisher?.name || "未知"}</span>
                              <span>{task.createdAt}</span>
                            </div>
                          </div>

                          {/* 验收操作按钮 */}
                          <div className="flex gap-3 flex-shrink-0">
                            <button
                              onClick={() => handleComplete(task.id)}
                              disabled={actionLoading}
                              className="px-5 py-2 bg-green-700 text-white font-medium rounded-lg hover:bg-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✓ 验收通过
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ---------- 审核历史记录 ---------- */}
            {activeTab === "history" && (
              <>
                {historyLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="text-white text-lg">加载中...</div>
                  </div>
                ) : reviewHistory.length === 0 ? (
                  <div className={`${cardBaseClass} p-12`}>
                    <div className="text-center">
                      <div className="text-5xl mb-4">📝</div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-3">暂无审核历史记录</h2>
                      <p className="text-gray-600">审核任务后，记录将显示在这里</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviewHistory.map((record) => (
                      <div key={record.id} className={`${cardBaseClass} p-6`}>
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-800">{record.taskTitle}</h3>
                              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${record.result === "approved"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-red-100 text-red-700 border border-red-200"}`}>
                                {record.resultText}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span>处理人：{record.reviewerName}</span>
                              <span>处理时间：{record.reviewedAt}</span>
                            </div>

                            {record.reason && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                                驳回原因：{record.reason}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ---------- 任务详情弹窗 ---------- */}
        <Modal
          isOpen={showDetailModal && selectedTask !== null}
          onClose={() => setShowDetailModal(false)}
          title="任务详情"
          size="lg"
        >
          {selectedTask && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${difficultyStyles[selectedTask.difficulty as TaskDifficulty]}`}>
                  {selectedTask.difficulty}
                </span>
                <span className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  {selectedTask.status}
                </span>
                <span className="text-gray-500 text-sm">发布者：{selectedTask.publisher?.name || "未知"}</span>
              </div>

              <h3 className="text-xl font-bold text-gray-800">{selectedTask.title}</h3>

              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">任务描述</h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
              </div>

              {selectedTask.techRequirements && selectedTask.techRequirements.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">技术需求</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.techRequirements.map((tech, index) => (
                      <span key={index} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-100">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <span className="text-2xl">💎</span>
                <span className="text-2xl font-bold text-amber-600">{selectedTask.reward}</span>
                <span className="text-gray-500">灵石</span>
              </div>

              {canReview && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleApprove(selectedTask.id)}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-green-700 text-white font-medium rounded-lg hover:bg-green-800 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? "处理中..." : "✓ 审核通过"}
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleRejectClick(selectedTask);
                    }}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-red-700 text-white font-medium rounded-lg hover:bg-red-800 transition-all disabled:opacity-50"
                  >
                    ✗ 拒绝
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* ---------- 拒绝弹窗 ---------- */}
        <Modal
          isOpen={showRejectModal && selectedTask !== null}
          onClose={() => setShowRejectModal(false)}
          title="拒绝任务"
        >
          {selectedTask && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-gray-200" style={{ backgroundColor: "#FAF9F7" }}>
                <p className="text-sm text-gray-600">任务：</p>
                <p className="font-medium text-gray-800">{selectedTask.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">拒绝原因（选填）</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请输入拒绝原因..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-red-700 text-white font-medium rounded-lg hover:bg-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "处理中..." : "确认拒绝"}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ---------- Toast 提示 ---------- */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg text-white font-medium z-50 ${toast.type === "success" ? "bg-green-700" : "bg-red-700"
              }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}