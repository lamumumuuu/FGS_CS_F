"use client";

import { useState, useEffect } from "react";
import { Task, TaskDifficulty, TaskStatus, TaskFilters } from "@/types/task";
import { fetchTasks, fetchTaskById } from "@/services/taskService";
import TaskCard from "@/components/TaskCard";
import TaskDetail from "@/components/TaskDetail";

type ViewMode = "list" | "detail" | "publish";

const difficultyOptions: (TaskDifficulty | "全部难度")[] = [
  "全部难度",
  "黑铁",
  "青铜",
  "白银",
  "黄金",
];

const statusOptions: (TaskStatus | "全部状态")[] = [
  "全部状态",
  "审核中",
  "等待中",
  "讨伐中",
  "已完成",
];

export default function TaskHall() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>({
    difficulty: "全部难度",
    status: "全部状态",
    keyword: "",
  });

  useEffect(() => {
    loadTasks();
  }, [filters]);

  async function loadTasks() {
    setLoading(true);
    try {
      const data = await fetchTasks(filters);
      setTasks(data);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleTaskClick(taskId: string) {
    try {
      const task = await fetchTaskById(taskId);
      if (task) {
        setSelectedTask(task);
        setViewMode("detail");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Failed to load task detail:", error);
    }
  }

  function handleBackToList() {
    setViewMode("list");
    setSelectedTask(null);
  }

  function handlePublishClick() {
    setViewMode("publish");
  }

  function handleAcceptTask() {
    if (selectedTask) {
      alert(`已接受委托：${selectedTask.title}`);
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFilters((prev) => ({ ...prev, keyword: e.target.value }));
  }

  function handleDifficultyChange(value: TaskDifficulty | "全部难度") {
    setFilters((prev) => ({ ...prev, difficulty: value }));
  }

  function handleStatusChange(value: TaskStatus | "全部状态") {
    setFilters((prev) => ({ ...prev, status: value }));
  }

  if (viewMode === "detail" && selectedTask) {
    return (
      <div className="flex-1 bg-amber-50/30 py-8 px-4 sm:px-6 lg:px-8">
        <TaskDetail task={selectedTask} onBack={handleBackToList} onAccept={handleAcceptTask} />
      </div>
    );
  }

  if (viewMode === "publish") {
    return (
      <div className="flex-1 bg-amber-50/30 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBackToList}
            className="mb-6 flex items-center gap-2 text-amber-700 hover:text-amber-900 font-medium transition-colors"
          >
            <span>←</span>
            <span>返回任务大厅</span>
          </button>
          <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-16">
            <div className="text-center">
              <div className="text-6xl mb-4">🏗️</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">施工中</h1>
              <p className="text-lg text-gray-500">发布悬赏功能正在建设中，敬请期待...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-amber-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">任务大厅</h1>
          <p className="text-lg text-gray-600">浏览悬赏令，接受委托，成为传奇勇者</p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-amber-100 p-5 mb-8">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            <div className="flex-1 lg:w-3/5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索任务..."
                  value={filters.keyword}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">难度：</span>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleDifficultyChange(e.target.value as TaskDifficulty | "全部难度")}
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm cursor-pointer"
                >
                  {difficultyOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">状态：</span>
                <select
                  value={filters.status}
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatus | "全部状态")}
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm cursor-pointer"
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
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium rounded-lg shadow-sm hover:from-amber-700 hover:to-amber-600 transition-all hover:shadow-md active:scale-95 whitespace-nowrap"
              >
                ✉️ 发送悬赏
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-amber-600 text-lg">加载中...</div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">暂无符合条件的任务</p>
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
