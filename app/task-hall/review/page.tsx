// app/task-hall/review/page.tsx

/**
 * 任务大厅 - 审核页面
 * 
 * 仅对授权用户（管理员/审核员）可见，用于审核待发布的悬赏任务。
 * 功能：
 * - 查看待审核任务列表
 * - 查看任务详情
 * - 审核通过 / 拒绝任务
 * 
 * 采用木质纹理背景风格设计，与任务大厅整体风格一致。
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Task } from "@/types/task";
import { taskApi } from "@/app/api/client";
import { usePermission } from "@/contexts/PermissionContext";

/* ------------------------------------------------------------------ */
/*  页面组件                                                           */
/* ------------------------------------------------------------------ */
export default function TaskReview() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, hasRole, hasPermission } = usePermission();

  /* ---------- 状态 ---------- */
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  /* ------------------------------------------------------------------ */
  /*  权限检查：未登录或无权限时重定向                                 */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  /* ------------------------------------------------------------------ */
  /*  数据获取：待审核任务列表                                         */
  /* ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------ */
  /*  审核操作                                                         */
  /* ------------------------------------------------------------------ */

  /** 审核通过 */
  async function handleApprove(taskId: string) {
    if (!confirm("确定通过该悬赏任务吗？")) return;

    setActionLoading(true);
    try {
      await taskApi.approveTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
      alert("审核通过成功");
    } catch (err) {
      alert(err instanceof Error ? err.message : "审核失败");
    } finally {
      setActionLoading(false);
    }
  }

  /** 打开拒绝弹窗 */
  function handleRejectClick(task: Task) {
    setSelectedTask(task);
    setRejectReason("");
    setShowRejectModal(true);
  }

  /** 确认拒绝 */
  async function handleConfirmReject() {
    if (!selectedTask) return;

    setActionLoading(true);
    try {
      await taskApi.rejectTask(selectedTask.id, rejectReason);
      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
      setShowRejectModal(false);
      setSelectedTask(null);
      setRejectReason("");
      alert("已拒绝该任务");
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败");
    } finally {
      setActionLoading(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  无权限提示                                                       */
  /* ------------------------------------------------------------------ */
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#8B7355" }}
      >
        <div className="text-white text-lg">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 会重定向到登录页
  }

  // 简单权限检查：如果没有审核相关角色或权限，显示无权限提示
  // 实际项目中应根据具体权限字段判断
  const canReview = hasRole("admin") || hasRole("sect_master") || hasRole("elder") || hasPermission("task:review");

  /* ------------------------------------------------------------------ */
  /*  渲染                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div
      className="flex-1 py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-72px)]"
      style={{
        backgroundColor: "#8B7355",
        backgroundImage: `
          linear-gradient(135deg, rgba(139, 115, 85, 0.9) 0%, rgba(101, 81, 59, 0.9) 100%),
          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px),
          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)
        `,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* ---------- 返回按钮 ---------- */}
        <Link
          href="/task-hall"
          className="inline-flex items-center gap-2 text-white hover:text-gray-200 font-medium mb-6 transition-colors"
        >
          <span>←</span>
          <span>返回任务大厅</span>
        </Link>

        {/* ---------- 页头 ---------- */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
            📋 任务审核
          </h1>
          <p className="text-lg text-gray-200">
            审核待发布的悬赏任务，维护宗门秩序
          </p>
        </div>

        {/* ---------- 无权限提示 ---------- */}
        {!canReview && (
          <div
            className="rounded-none shadow-md border border-gray-300 p-12 mb-8"
            style={{ backgroundColor: "#FAF9F7" }}
          >
            <div className="text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                权限不足
              </h2>
              <p className="text-gray-600">
                您没有审核任务的权限，请联系管理员获取授权
              </p>
            </div>
          </div>
        )}

        {/* ---------- 错误提示 ---------- */}
        {error && canReview && (
          <div
            className="rounded-none border border-red-300 p-4 mb-6"
            style={{ backgroundColor: "#FEF2F2" }}
          >
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* ---------- 任务列表 ---------- */}
        {canReview && (
          <>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-white text-lg">加载中...</div>
              </div>
            ) : tasks.length === 0 ? (
              <div
                className="rounded-none shadow-md border border-gray-300 p-12"
                style={{ backgroundColor: "#FAF9F7" }}
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    暂无待审核任务
                  </h2>
                  <p className="text-gray-600">
                    所有悬赏任务都已审核完毕
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-none shadow-md border border-gray-300 p-6 hover:shadow-lg transition-all"
                    style={{ backgroundColor: "#FAF9F7" }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* 任务信息 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-800">
                            {task.title}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-none text-sm font-medium ${
                              task.difficulty === "黄金"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                                : task.difficulty === "白银"
                                ? "bg-gray-100 text-gray-700 border border-gray-300"
                                : task.difficulty === "青铜"
                                ? "bg-orange-100 text-orange-700 border border-orange-300"
                                : "bg-stone-200 text-stone-700 border border-stone-400"
                            }`}
                          >
                            {task.difficulty}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {task.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            💎 <span className="font-medium text-amber-700">{task.reward}</span> 灵石
                          </span>
                          <span>
                            <span>发布者：{task.publisher?.name || "未知"}</span>                          </span>
                          <span>
                            {task.createdAt ? new Date(task.createdAt).toLocaleString() : ""}
                          </span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-3 flex-shrink-0">
                        <button
                          onClick={() => handleApprove(task.id)}
                          disabled={actionLoading}
                          className="px-5 py-2 bg-green-700 text-white font-medium rounded-none hover:bg-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ✓ 通过
                        </button>
                        <button
                          onClick={() => handleRejectClick(task)}
                          disabled={actionLoading}
                          className="px-5 py-2 bg-red-700 text-white font-medium rounded-none hover:bg-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* ---------- 拒绝弹窗 ---------- */}
        {showRejectModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="rounded-none shadow-2xl border border-gray-300 p-6 w-full max-w-md"
              style={{ backgroundColor: "#FAF9F7" }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                拒绝任务
              </h3>
              <p className="text-gray-600 mb-4">
                请填写拒绝原因（可选）：
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-none hover:bg-gray-300 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-700 text-white font-medium rounded-none hover:bg-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "处理中..." : "确认拒绝"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
