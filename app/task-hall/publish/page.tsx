// app/task-hall/publish/page.tsx

/**
 * 发布悬赏页面
 * 
 * 提供悬赏发布表单，包含发布者信息卡片、历史发布记录入口。
 * 支持标题、难度、灵石、描述、技术需求等字段的输入与校验。
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TaskDifficulty, Task } from "@/types/task";
import { taskApi, sectApi } from "@/app/api/client";
import { usePermission } from "@/contexts/PermissionContext";
import { QUEST_PERMISSIONS } from "@/types/permissions";
import { useToast } from "@/contexts/ToastContext";
import Modal from "@/components/Modal";

export default function PublishPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading, hasPermission } = usePermission();
  const { showPermissionDenied } = useToast();

  const [prefix, setPrefix] = useState<"无" | "【急】">("无");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [difficulty, setDifficulty] = useState<TaskDifficulty>("黑铁");
  const todayStr = new Date().toISOString().split("T")[0];
  const [deadline, setDeadline] = useState(todayStr);
  const [techRequirements, setTechRequirements] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 发布范围：全协会或本峰
  const [publishScope, setPublishScope] = useState<"global" | "peak">("peak");

  // 历史发布记录相关状态
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [userLingshi, setUserLingshi] = useState(0);
  const [lingshiLoading, setLingshiLoading] = useState(true);

  /** 加载用户灵石数量：优先使用 context 中的 user.lingshi，兼容 sectApi 兜底 */
  const loadUserLingshi = async () => {
    setLingshiLoading(true);
    try {
      // 优先使用权限上下文中的 user.lingshi（已经通过后端 /users/me 接口获取）
      if (user?.lingshi !== undefined && user?.lingshi !== null) {
        setUserLingshi(user.lingshi);
        return;
      }
      // 兜底：使用 sectApi 查询弟子数据
      const currentUser = await sectApi.getCurrentUser();
      const disciples = await sectApi.getAllDisciples();
      const myDisciple = disciples.find(d => d.name === currentUser.name);
      if (myDisciple && myDisciple.lingshi !== undefined) {
        setUserLingshi(myDisciple.lingshi);
      }
    } catch (err) {
      console.error("Failed to load user lingshi:", err);
      setUserLingshi(0);
    } finally {
      setLingshiLoading(false);
    }
  };

  /** 加载我的发布历史 */
  const loadMyTasks = async () => {
    setHistoryLoading(true);
    try {
      const data = await taskApi.getMyTasks();
      setMyTasks(data);
    } catch (err) {
      console.error("Failed to load my tasks:", err);
      setMyTasks([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  /** 打开历史记录弹窗 */
  const handleOpenHistory = () => {
    setShowHistoryModal(true);
    loadMyTasks();
  };

  /** 页面加载时获取用户灵石数量，当 context.user 变化时也同步 */
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadUserLingshi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, user?.lingshi]);

  /** 获取状态样式 */
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "审核中":
        return { bg: "bg-amber-100", color: "text-amber-700", border: "border-amber-300" };
      case "等待中":
        return { bg: "bg-blue-100", color: "text-blue-700", border: "border-blue-300" };
      case "讨伐中":
        return { bg: "bg-purple-100", color: "text-purple-700", border: "border-purple-300" };
      case "已完成":
        return { bg: "bg-green-100", color: "text-green-700", border: "border-green-300" };
      case "已驳回":
        return { bg: "bg-red-100", color: "text-red-700", border: "border-red-300" };
      default:
        return { bg: "bg-gray-100", color: "text-gray-700", border: "border-gray-300" };
    }
  };

  function validateReward(value: string) {
    if (!value.trim()) return "请输入灵石数量";
    const num = parseInt(value);
    if (isNaN(num)) return "请输入有效的数字";
    if (num <= 0) return "灵石数量必须大于等于1";
    if (num > userLingshi) return `灵石数量不能超过可用余额（${userLingshi}）`;
    return "";
  }

  function validateTitle(value: string) {
    if (!value.trim()) return "请输入悬赏标题";
    if (value.length < 5) return "标题至少5个字符";
    if (value.length > 50) return "标题最多50个字符";
    return "";
  }

  function validateDescription(value: string) {
    if (!value.trim()) return "请输入悬赏描述";
    if (value.length < 10) return "描述至少10个字符";
    if (value.length > 500) return "描述最多500个字符";
    return "";
  }

  /** 权限检查 */
  const canPublishGlobal = hasPermission(QUEST_PERMISSIONS.PUBLISH_GLOBAL);
  const canPublishPeak = hasPermission(QUEST_PERMISSIONS.PUBLISH_PEAK);
  const canPublish = canPublishGlobal || canPublishPeak;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!canPublish) {
      showPermissionDenied("发布悬赏");
      return;
    }

    const titleErr = validateTitle(title);
    const descErr = validateDescription(description);
    const rewardErr = validateReward(reward);
    if (titleErr || descErr || rewardErr) {
      setFormError(titleErr || descErr || rewardErr);
      return;
    }

    setSubmitting(true);
    try {
      // 根据发布范围决定传递的数据
      const taskData: any = {
        title: prefix === "【急】" ? `【急】${title}` : title,
        description,
        reward: parseInt(reward),
        difficulty,
        deadline: deadline || undefined,
        techRequirements: techRequirements || undefined,
        // 如果是本峰发布，需要传递当前用户的峰ID（假设后端可从用户信息中获取，或前端传递）
        // 这里传递 publishScope 标识，后端可根据此标识进行过滤
        type: publishScope === "global" ? "全协会" : "本峰",
      };

      await taskApi.createTask(taskData);
      alert("悬赏已提交，等待审核中...");
      router.push("/task-hall");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (!authLoading && !isAuthenticated) {
    router.push("/auth");
    return null;
  }

  /* ---------- 权限不足提示页面 ---------- */
  if (!authLoading && isAuthenticated && !canPublish) {
    return (
      <div
        className="flex-1 py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-72px)] flex items-center justify-center"
        style={{ background: "radial-gradient(ellipse at 30% 35%, #291b0f 0%, #1d140b 70%)" }}
      >
        <div className="max-w-md w-full rounded-xl border border-red-700 shadow-xl p-8 bg-[#f2e2c1] text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">权限不足</h1>
          <p className="text-[#2d1f10] mb-6">
            您没有发布悬赏的权限，请联系管理员开通。
          </p>
          <Link
            href="/task-hall"
            onClick={(e) => { e.preventDefault(); router.push("/task-hall"); }}
            className="inline-block px-6 py-2.5 rounded-lg font-medium text-[#f0e6c8] transition-all hover:opacity-90"
            style={{ backgroundColor: "#b94c00" }}
          >
            返回任务大厅
          </Link>
        </div>
      </div>
    );
  }

  const pageBackground = {
    background: "radial-gradient(ellipse at 30% 35%, #291b0f 0%, #1d140b 70%)",
  };

  const baseInputClass =
    "px-4 py-3 border rounded-lg bg-[#ecdbb5] text-[#2d1f10] placeholder-[#6b5740] " +
    "transition-all";

  const errorInputClass = "border-red-400";

  const labelClass = "block text-sm font-medium text-[#2d1f10] mb-2";

  return (
    <div
      className="flex-1 py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-72px)]"
      style={pageBackground}
    >
      <div className="max-w-4xl mx-auto">
        <Link
          href="/task-hall"
          onClick={(e) => { e.preventDefault(); router.push("/task-hall"); }}
          className="inline-flex items-center gap-2 text-white hover:text-gray-200 font-medium mb-6 transition-colors"
        >
          <span>←</span>
          <span>返回任务大厅</span>
        </Link>

        <div className="rounded-xl border border-gray-700 shadow-xl p-8 bg-[#f2e2c1]">
          <h1 className="text-3xl font-bold text-[#2d1f10] mb-8 text-center font-shan">
            ✉️ 发布悬赏令
          </h1>

          <div className="flex flex-col gap-8">
            {/* 发布者信息卡片 + 历史记录按钮 */}
            <div className="w-full">
              <div className="p-5 h-full bg-[#f2e2c1]">
                <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-400">
                  <h3 className="text-lg font-bold text-[#2d1f10]">发布者信息</h3>
                  {/* 历史发布记录按钮 */}
                  <button
                    onClick={handleOpenHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg hover:opacity-90 transition-all"
                    style={{
                      backgroundColor: "#b94c00",
                      color: "#f0e6c8",
                    }}
                  >
                    <span>📜</span>
                    <span>历史发布记录</span>
                  </button>
                </div>
                {authLoading ? (
                  <div className="text-gray-600">加载中...</div>
                ) : isAuthenticated && user ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-2xl border border-gray-400">
                          👤
                        </div>
                        <div>
                          <div className="font-bold text-[#2d1f10]">{user.username}</div>
                          <div className="text-sm text-gray-600">ID：{user.id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-amber-100 border border-amber-300 rounded-lg px-4 py-2">
                        <span className="text-xl">💎</span>
                        <span className="text-xl font-bold text-amber-700">
                          {lingshiLoading ? "加载中..." : userLingshi}
                        </span>
                        <span className="text-sm text-gray-600">可用</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 pt-4 border-t border-gray-400">
                      <p>💡 悬赏发布后将进入审核流程</p>
                      <p className="mt-2">💡 审核通过后扣除相应灵石</p>
                    </div>
                    <div className="border-t-2 border-gray-600 my-4" />
                  </div>
                ) : (
                  <div className="text-gray-600">请先登录</div>
                )}
              </div>
            </div>

            <div className="w-full">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={labelClass}>
                    悬赏发布范围 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 mt-2">
                    {/* 本峰悬赏：有本峰发布权限的用户可见 */}
                    {canPublishPeak && (
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${publishScope === "peak" ? "border-amber-500 bg-amber-100" : "border-gray-300 hover:border-gray-400"}`}>
                        <input
                          type="radio"
                          name="publishScope"
                          value="peak"
                          checked={publishScope === "peak"}
                          onChange={() => setPublishScope("peak")}
                          className="accent-amber-600"
                        />
                        <span className="text-sm font-medium">本峰悬赏</span>
                      </label>
                    )}
                    {/* 全协会悬赏：有全局发布权限的用户可见（无权限用户完全看不到此选项） */}
                    {canPublishGlobal && (
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${publishScope === "global" ? "border-amber-500 bg-amber-100" : "border-gray-300 hover:border-gray-400"}`}>
                        <input
                          type="radio"
                          name="publishScope"
                          value="global"
                          checked={publishScope === "global"}
                          onChange={() => setPublishScope("global")}
                          className="accent-amber-600"
                        />
                        <span className="text-sm font-medium">全协会悬赏</span>
                      </label>
                    )}
                    {/* 若仅有一项权限，则提示信息 */}
                    {!canPublishGlobal && canPublishPeak && (
                      <span className="text-xs text-gray-500 self-center">(仅可发布本峰)</span>
                    )}
                    {canPublishGlobal && !canPublishPeak && (
                      <span className="text-xs text-gray-500 self-center">(仅可发布全协会)</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    悬赏标题 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value as "无" | "【急】")}
                      className={`w-24 cursor-pointer ${baseInputClass} border-[#3d2b1f]`}
                    >
                      <option value="无">无</option>
                      <option value="【急】">【急】</option>
                    </select>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="请输入悬赏标题..."
                      className={`flex-1 ${baseInputClass} ${title && validateTitle(title) ? errorInputClass : "border-[#3d2b1f]"
                        }`}
                    />
                  </div>
                  {title && validateTitle(title) && (
                    <p className="mt-1 text-sm text-red-500">{validateTitle(title)}</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className={labelClass}>
                      任务难度 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
                      className={`w-full cursor-pointer ${baseInputClass} border-[#3d2b1f]`}
                    >
                      {(["黑铁", "青铜", "白银", "黄金"] as TaskDifficulty[]).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className={labelClass}>
                      截止日期
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      min={todayStr}
                      onChange={(e) => setDeadline(e.target.value)}
                      className={`w-full ${baseInputClass} border-[#3d2b1f]`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    悬赏灵石 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={reward}
                      onChange={(e) => setReward(e.target.value)}
                      placeholder="请输入灵石数量..."
                      className={`w-full pl-12 ${baseInputClass} ${reward && validateReward(reward) ? errorInputClass : "border-[#3d2b1f]"
                        }`}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">💎</span>
                  </div>
                  {reward && validateReward(reward) && (
                    <p className="mt-1 text-sm text-red-500">{validateReward(reward)}</p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    悬赏描述 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="请详细描述悬赏内容..."
                    rows={5}
                    className={`w-full resize-none ${baseInputClass} ${description && validateDescription(description)
                      ? errorInputClass
                      : "border-[#3d2b1f]"
                      }`}
                  />
                  {description && validateDescription(description) && (
                    <p className="mt-1 text-sm text-red-500">{validateDescription(description)}</p>
                  )}
                </div>

                {/* 技术需求改为与悬赏描述一样的 textarea，纯文本显示 */}
                <div className={labelClass}>
                  技术需求
                  <textarea
                    value={techRequirements}
                    onChange={(e) => setTechRequirements(e.target.value)}
                    placeholder="例如：React, TypeScript, Node.js"
                    rows={3}
                    className={`w-full resize-none ${baseInputClass} border-[#3d2b1f]`}
                  />
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-400 rounded-lg text-red-600 text-sm">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !isAuthenticated || !canPublish}
                  className="w-full py-3 bg-amber-700 text-white font-medium rounded-lg hover:bg-amber-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "提交中..." : "📜 提交悬赏"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- 历史发布记录弹窗 ---------- */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="我的历史发布记录"
        size="lg"
      >
        {historyLoading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : myTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无发布记录</div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {myTasks.map((task) => {
              const statusStyle = getStatusStyle(task.status);
              return (
                <div
                  key={task.id}
                  className="p-4 rounded-xl border transition-all hover:shadow-sm"
                  style={{
                    borderColor: "rgba(15, 118, 110, 0.15)",
                    backgroundColor: "rgba(236, 253, 245, 0.5)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800 truncate">
                          {task.title}
                        </h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}
                        >
                          {task.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>🎯 {task.difficulty}</span>
                        <span>💎 {task.reward} 灵石</span>
                        <span>📅 {task.createdAt}</span>
                      </div>
                      {task.status === "已驳回" && task.rejectReason && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          驳回原因：{task.rejectReason}
                        </div>
                      )}
                      {task.status === "已完成" && task.completer && (
                        <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          ✅ 完成者：{task.completer.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}