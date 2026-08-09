// app/task-hall/page.tsx

/**
 * 任务大厅页面（发布已独立为 /task-hall/publish）
 * 
 * 包含两种视图模式：
 * - list：任务列表卡片，支持按关键词、难度、状态筛选
 * - detail：点击任务后展示完整详情，可接受委托
 * 
 * 通过 taskApi 与后端交互获取任务数据。
 * 背景采用径向渐变：左上角和中心稍亮（#291b0f），
 * 右上角、右下角、左下角暗淡（#1d140b）。
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Task, TaskDifficulty, TaskStatus, TaskFilters } from "@/types/task";
import { taskApi } from "@/app/api/client";
import { usePermission } from "@/contexts/PermissionContext";
import { PermissionButton } from "@/components/PermissionButton";
import { QUEST_PERMISSIONS } from "@/types/permissions";
import TaskCard from "@/components/TaskCard";
import TaskDetail from "@/components/TaskDetail";

/** 支持的视图模式 */
type ViewMode = "list" | "detail";

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
  "等待中",
  "讨伐中",
  "已完成",
];

/* ------------------------------------------------------------------ */
/*  页面组件                                                           */
/* ------------------------------------------------------------------ */
export default function TaskHall() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading, hasPermission } = usePermission();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>({
    difficulty: "全部难度",
    status: "全部状态",
    keyword: "",
  });

  /* ------------------------------------------------------------------ */
  /*  数据获取：当筛选条件变化时重新请求任务列表                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let ignore = false;

    async function fetchTasks() {
      setLoading(true);
      try {
        const data = await taskApi.getTasks(filters);
        const filtered = data.filter(task => task.status !== "审核中" && task.status !== "已驳回");
        if (!ignore) setTasks(filtered);
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

  /** 接受委托 */
  async function handleAcceptTask() {
    if (!selectedTask) return;
    // 权限校验：接取任务需要 QUEST_PERMISSIONS.ACCEPT 权限
    if (!hasPermission(QUEST_PERMISSIONS.ACCEPT)) {
      alert("您没有接取任务的权限");
      return;
    }
    try {
      const updatedTask = await taskApi.acceptTask(selectedTask.id);
      setSelectedTask(updatedTask);
      alert(`已接受委托：${selectedTask.title}`);
    } catch (error) {
      console.error("接受任务失败:", error);
      alert(error instanceof Error ? error.message : "接受委托失败");
    }
  }

  /** 编辑任务 */
  async function handleEditTask(taskToEdit: Task) {
    const newTitle = prompt("请输入新的任务标题:", taskToEdit.title);
    if (newTitle === null) return;
    const newDescription = prompt("请输入新的任务描述:", taskToEdit.description);
    if (newDescription === null) return;

    try {
      const updatedTask = await taskApi.updateTask(taskToEdit.id, {
        title: newTitle,
        description: newDescription,
        difficulty: taskToEdit.difficulty,
        reward: taskToEdit.reward,
      });
      setSelectedTask(updatedTask);
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? transformTask(updatedTask) : t));
      alert("任务更新成功");
    } catch (error) {
      console.error("编辑任务失败:", error);
      alert(error instanceof Error ? error.message : "编辑任务失败");
    }
  }

  /** 删除任务 */
  async function handleDeleteTask(taskId: string) {
    try {
      await taskApi.deleteTask(taskId);
      setSelectedTask(null);
      setViewMode("list");
      setTasks(prev => prev.filter(t => t.id !== taskId));
      alert("任务删除成功");
    } catch (error) {
      console.error("删除任务失败:", error);
      alert(error instanceof Error ? error.message : "删除任务失败");
    }
  }

  /** 强制结项 */
  async function handleForceCloseTask(taskId: string) {
    try {
      const updatedTask = await taskApi.forceCloseTask(taskId);
      setSelectedTask(updatedTask);
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? transformTask(updatedTask) : t));
      alert("任务已强制结项");
    } catch (error) {
      console.error("强制结项失败:", error);
      alert(error instanceof Error ? error.message : "强制结项失败");
    }
  }

  /** 辅助函数：将后端数据转换为前端格式（如需要） */
  function transformTask(backendTask: any): Task {
    // 此处可复用 taskApi 中的转换逻辑，但为了简单，直接使用类型断言
    return backendTask as unknown as Task;
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
  /*  公共背景样式                                                      */
  /* ------------------------------------------------------------------ */
  const pageBackgroundStyle: React.CSSProperties = {
    background: "radial-gradient(ellipse at 30% 35%, #291b0f 0%, #1d140b 70%)",
  };

  /* ------------------------------------------------------------------ */
  /*  视图渲染：detail 模式                                           */
  /* ------------------------------------------------------------------ */
  if (viewMode === "detail" && selectedTask) {
    return (
      <div
        className="flex-1 py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-72px)]"
        style={pageBackgroundStyle}
      >
        <TaskDetail
          task={selectedTask}
          onBack={handleBackToList}
          onAccept={handleAcceptTask}
          onUpdateTask={setSelectedTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
          onForceClose={handleForceCloseTask}
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  视图渲染：list 模式（默认）                                      */
  /* ------------------------------------------------------------------ */
  return (
    <div
      className="flex-1 py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-72px)]"
      style={pageBackgroundStyle}
    >
      <div className="max-w-7xl mx-auto relative">
        {/* 任务审核按钮：绝对定位到右上角 */}
        {hasPermission(QUEST_PERMISSIONS.REVIEW_RESULT) && (
          <Link
            href="/task-hall/review"
            onClick={(e) => { e.preventDefault(); router.push("/task-hall/review"); }}
            className="absolute top-0 right-0 z-10 px-4 py-2 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition-all"
          >
            📋 任务审核
          </Link>
        )}

        {/* 页头 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3 drop-shadow-lg font-shan" style={{ color: "#d4a574" }}>
            任务大厅
          </h1>
          <p className="text-medium font-shan" style={{ color: "#a07848" }}>
            浏览悬赏令，接受委托，成为传奇勇者
          </p>
        </div>

        {/* 筛选栏 */}
        <div
          className="rounded-lg shadow-md p-5 mb-8"
          style={{ backgroundColor: "#2b1e10", border: "1px solid #332418" }}
        >
          <div className="flex items-center gap-4">
            {/* 搜索框 */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索任务..."
                  value={filters.keyword}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-3 pl-10 border border-gray-600 rounded-lg text-white placeholder-[#6b5740] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  style={{ backgroundColor: "#1a120b", border: "1px solid #332418" }}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
            </div>

            {/* 筛选选项 + 发布按钮 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <select
                value={filters.difficulty}
                onChange={(e) =>
                  handleDifficultyChange(
                    e.target.value as TaskDifficulty | "全部难度"
                  )
                }
                className="px-3 py-2 border border-gray-600 rounded-lg text-[#f0e6c8] focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm cursor-pointer"
                style={{ backgroundColor: "#1a120b", border: "1px solid #332418" }}
              >
                {difficultyOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) =>
                  handleStatusChange(
                    e.target.value as TaskStatus | "全部状态"
                  )
                }
                className="px-3 py-2 border border-gray-600 rounded-lg text-[#f0e6c8] focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm cursor-pointer"
                style={{ backgroundColor: "#1a120b", border: "1px solid #332418" }}
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              {/* 发布悬赏按钮：仅对有任何发布权限的用户可见，完全隐藏对无权限用户 */}
              {(hasPermission(QUEST_PERMISSIONS.PUBLISH_PEAK) ||
                hasPermission(QUEST_PERMISSIONS.PUBLISH_GLOBAL)) && (
                  <Link
                    href="/task-hall/publish"
                    onClick={(e) => { e.preventDefault(); router.push("/task-hall/publish"); }}
                    className="px-5 py-2.5 font-medium text-[#f0e6c8] rounded-lg hover:opacity-90 transition-all whitespace-nowrap"
                    style={{ backgroundColor: "#b94c00" }}
                  >
                    发布悬赏
                  </Link>
                )}
            </div>
          </div>
        </div>

        {/* 任务卡片网格 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-white text-lg">加载中...</div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📜</div>
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