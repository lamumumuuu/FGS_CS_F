// app/task-hall/page.tsx

/**
 * 任务大厅页面
 * 
 * 包含三种视图模式：
 * - list：任务列表卡片，支持按关键词、难度、状态筛选
 * - detail：点击任务后展示完整详情，可接受委托
 * - publish：发布悬赏表单，包含发布者信息面板和灵石数量验证
 * 
 * 通过 taskApi 与后端交互获取任务数据。
 * 采用木质纹理背景风格设计。
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Task, TaskDifficulty, TaskStatus, TaskFilters } from "@/types/task";
import { taskApi } from "@/app/api/client";
import { usePermission } from "@/contexts/PermissionContext";
import TaskCard from "@/components/TaskCard";
import TaskDetail from "@/components/TaskDetail";

/** 支持的视图模式 */
type ViewMode = "list" | "detail" | "publish";

/** 难度筛选选项，含"全部难度"表示不筛选 */
const difficultyOptions: (TaskDifficulty | "全部难度")[] = [
  "全部难度",
  "黑铁",
  "青铜",
  "白银",
  "黄金",
];

/** 状态筛选选项，含"全部状态"表示不筛选 */
const statusOptions: (TaskStatus | "全部状态")[] = [
  "全部状态",
  "审核中",
  "等待中",
  "讨伐中",
  "已完成",
];

/* ------------------------------------------------------------------ */
/*  页面组件                                                           */
/* ------------------------------------------------------------------ */
export default function TaskHall() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = usePermission();

  /* ---------- 视图与数据状态 ---------- */
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>({
    difficulty: "全部难度",
    status: "全部状态",
    keyword: "",
  });

  /* ---------- 发布表单状态 ---------- */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [difficulty, setDifficulty] = useState<TaskDifficulty>("黑铁");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---------- 用户可用灵石（模拟数据，待后端接入） ---------- */
  const userLingshi = 1000;

  /* ------------------------------------------------------------------ */
  /*  数据获取：当筛选条件变化时重新请求任务列表                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let ignore = false;

    async function fetchTasks() {
      setLoading(true);
      try {
        const data = await taskApi.getTasks(filters);
        if (!ignore) setTasks(data);
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchTasks();

    return () => {
      ignore = true;
    };
  }, [filters]);

  /* ------------------------------------------------------------------ */
  /*  交互处理函数                                                     */
  /* ------------------------------------------------------------------ */

  /** 点击任务卡片 -> 请求详情并切换到详情视图 */
  async function handleTaskClick(taskId: string) {
    try {
      const task = await taskApi.getTaskById(taskId);
      if (task) {
        setSelectedTask(task);
        setViewMode("detail");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Failed to load task detail:", error);
    }
  }

  /** 从详情页返回列表 */
  function handleBackToList() {
    setViewMode("list");
    setSelectedTask(null);
  }

  /** 切换到发布视图（未登录则跳转登录） */
  function handlePublishClick() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setViewMode("publish");
    setFormError("");
  }

  /** 接受委托 */
  function handleAcceptTask() {
    if (selectedTask) {
      alert(`已接受委托：${selectedTask.title}`);
    }
  }

  /** 搜索关键词变更 */
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFilters((prev) => ({ ...prev, keyword: e.target.value }));
  }

  /** 难度筛选变更 */
  function handleDifficultyChange(value: TaskDifficulty | "全部难度") {
    setFilters((prev) => ({ ...prev, difficulty: value }));
  }

  /** 状态筛选变更 */
  function handleStatusChange(value: TaskStatus | "全部状态") {
    setFilters((prev) => ({ ...prev, status: value }));
  }

  /* ------------------------------------------------------------------ */
  /*  发布悬赏：表单验证与提交                                          */
  /* ------------------------------------------------------------------ */

  /** 灵石数量实时验证 */
  function validateReward(value: string): string {
    if (!value.trim()) return "请输入灵石数量";
    const num = parseInt(value, 10);
    if (isNaN(num)) return "请输入有效的数字";
    if (num <= 0) return "灵石数量必须大于0";
    if (num > userLingshi) return `灵石数量不能超过可用余额（${userLingshi}）`;
    return "";
  }

  /** 标题验证 */
  function validateTitle(value: string): string {
    if (!value.trim()) return "请输入悬赏标题";
    if (value.length < 5) return "标题至少5个字符";
    if (value.length > 50) return "标题最多50个字符";
    return "";
  }

  /** 描述验证 */
  function validateDescription(value: string): string {
    if (!value.trim()) return "请输入悬赏描述";
    if (value.length < 10) return "描述至少10个字符";
    if (value.length > 500) return "描述最多500个字符";
    return "";
  }

  /** 提交悬赏 */
  async function handlePublishSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const titleErr = validateTitle(title);
    const descErr = validateDescription(description);
    const rewardErr = validateReward(reward);

    if (titleErr || descErr || rewardErr) {
      setFormError(titleErr || descErr || rewardErr);
      return;
    }

    setSubmitting(true);
    try {
      await taskApi.createTask({
        title,
        description,
        reward: parseInt(reward, 10),
        difficulty,
      });
      alert("悬赏已提交，等待审核中...");
      setViewMode("list");
      setTitle("");
      setDescription("");
      setReward("");
      setDifficulty("黑铁");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  视图渲染：detail 模式                                           */
  /* ------------------------------------------------------------------ */
  if (viewMode === "detail" && selectedTask) {
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
        <TaskDetail
          task={selectedTask}
          onBack={handleBackToList}
          onAccept={handleAcceptTask}
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  视图渲染：publish 模式（发布悬赏）                               */
  /* ------------------------------------------------------------------ */
  if (viewMode === "publish") {
    const rewardError = validateReward(reward);
    const titleError = validateTitle(title);
    const descError = validateDescription(description);

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
        <div className="max-w-4xl mx-auto">
          {/* 返回按钮 */}
          <button
            onClick={handleBackToList}
            className="mb-6 flex items-center gap-2 text-white hover:text-gray-200 font-medium transition-colors"
          >
            <span>←</span>
            <span>返回任务大厅</span>
          </button>

          {/* 发布窗口：米白水墨纸纹背景 */}
          <div
            className="rounded-none shadow-2xl border border-gray-300 p-8"
            style={{
              backgroundColor: "#F5F3F0",
              backgroundImage: `
                radial-gradient(ellipse at top left, rgba(200, 180, 160, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at bottom right, rgba(180, 160, 140, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 30% 70%, rgba(210, 190, 170, 0.08) 0%, transparent 30%)
              `,
            }}
          >
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              ✉️ 发布悬赏令
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* ---------- 左侧：发布者信息面板 ---------- */}
              <div className="lg:col-span-2">
                <div
                  className="rounded-none border border-gray-300 p-5 h-full"
                  style={{ backgroundColor: "#FAF9F7" }}
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                    发布者信息
                  </h3>

                  {authLoading ? (
                    <div className="text-gray-500">加载中...</div>
                  ) : isAuthenticated && user ? (
                    <div className="space-y-4">
                      {/* 头像 */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl border border-gray-300">
                          👤
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID：{user.id}
                          </div>
                        </div>
                      </div>

                      {/* 灵石余额 */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">可用灵石</span>
                          <span className="font-bold text-amber-700 text-xl">
                            💎 {userLingshi}
                          </span>
                        </div>
                      </div>

                      {/* 提示 */}
                      <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
                        <p>💡 悬赏发布后将进入审核流程</p>
                        <p className="mt-2">💡 审核通过后扣除相应灵石</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">请先登录</div>
                  )}
                </div>
              </div>

              {/* ---------- 右侧：表单输入区 ---------- */}
              <div className="lg:col-span-3">
                <form onSubmit={handlePublishSubmit} className="space-y-5">
                  {/* 标题 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      悬赏标题 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="请输入悬赏标题..."
                      className={`w-full px-4 py-3 border rounded-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all ${
                        title && titleError
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300 bg-white"
                      }`}
                    />
                    {title && titleError && (
                      <p className="mt-1 text-sm text-red-500">{titleError}</p>
                    )}
                  </div>

                  {/* 难度选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      任务难度 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent cursor-pointer"
                    >
                      {(["黑铁", "青铜", "白银", "黄金"] as TaskDifficulty[]).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 灵石数量 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      悬赏灵石 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={reward}
                        onChange={(e) => setReward(e.target.value)}
                        placeholder="请输入灵石数量..."
                        className={`w-full px-4 py-3 pl-12 border rounded-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all ${
                          reward && rewardError
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 bg-white"
                        }`}
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
                        💎
                      </span>
                    </div>
                    {reward && rewardError && (
                      <p className="mt-1 text-sm text-red-500">{rewardError}</p>
                    )}
                    {!rewardError && reward && parseInt(reward) > 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        提交后将冻结 {reward} 灵石，审核通过后扣除
                      </p>
                    )}
                  </div>

                  {/* 描述 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      悬赏描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="请详细描述悬赏内容、要求、注意事项..."
                      rows={5}
                      className={`w-full px-4 py-3 border rounded-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all resize-none ${
                        description && descError
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300 bg-white"
                      }`}
                    />
                    {description && descError && (
                      <p className="mt-1 text-sm text-red-500">{descError}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-400 text-right">
                      {description.length} / 500
                    </p>
                  </div>

                  {/* 全局错误提示 */}
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-none text-red-600 text-sm">
                      {formError}
                    </div>
                  )}

                  {/* 提交按钮 */}
                  <button
                    type="submit"
                    disabled={submitting || !isAuthenticated}
                    className="w-full py-3 bg-gray-800 text-white font-medium rounded-none hover:bg-gray-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "提交中..." : "📜 提交悬赏"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  视图渲染：list 模式（默认）                                      */
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
      <div className="max-w-7xl mx-auto">
        {/* 页头 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
            任务大厅
          </h1>
          <p className="text-lg text-gray-200">
            浏览悬赏令，接受委托，成为传奇勇者
          </p>
        </div>

        {/* 筛选栏 */}
        <div
          className="rounded-none shadow-md border border-gray-300 p-5 mb-8"
          style={{ backgroundColor: "#FAF9F7" }}
        >
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            {/* 搜索框 */}
            <div className="flex-1 lg:w-3/5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索任务..."
                  value={filters.keyword}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
            </div>

            {/* 难度 + 状态下拉 + 发布按钮 */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">难度：</span>
                <select
                  value={filters.difficulty}
                  onChange={(e) =>
                    handleDifficultyChange(
                      e.target.value as TaskDifficulty | "全部难度"
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm cursor-pointer"
                >
                  {difficultyOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">状态：</span>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    handleStatusChange(
                      e.target.value as TaskStatus | "全部状态"
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm cursor-pointer"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handlePublishClick}
                className="px-5 py-2.5 bg-gray-800 text-white font-medium rounded-none hover:bg-gray-900 transition-all active:scale-95 whitespace-nowrap"
              >
                ✉️ 发送悬赏
              </button>
            </div>
          </div>
        </div>

        {/* 内容区：加载中 / 空数据 / 任务卡片网格 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-white text-lg">加载中...</div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-200 text-lg">暂无符合条件的任务</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => handleTaskClick(task.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
