// components/TaskDetail.tsx

/**
 * 任务详情组件
 * 
 * 展示单个任务的完整信息，包括描述、技术需求、发布者、赏金等。
 * 根据任务状态提供“接受委托”按钮或禁用状态。
 */

"use client";

import { Task, TaskDifficulty, TaskStatus } from "@/types/task";

interface TaskDetailProps {
  task: Task;                        /// 任务数据
  onBack: () => void;                /// 返回列表回调
  onAccept?: () => void;             /// 接受委托回调（仅等待中状态可用）
}

/** 难度徽章样式 */
const difficultyStyles: Record<TaskDifficulty, string> = {
  黑铁: "bg-gray-700 text-gray-100",
  青铜: "bg-amber-700 text-amber-50",
  白银: "bg-slate-400 text-slate-900",
  黄金: "bg-yellow-500 text-yellow-900",
};

/** 状态徽章样式 */
const statusStyles: Record<TaskStatus, string> = {
  审核中: "bg-blue-100 text-blue-700 border-blue-200",
  等待中: "bg-green-100 text-green-700 border-green-200",
  讨伐中: "bg-orange-100 text-orange-700 border-orange-200",
  已完成: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function TaskDetail({ task, onBack, onAccept }: TaskDetailProps) {
  const canAccept = task.status === "等待中";   /// 只有等待中的任务可被接受

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-amber-700 hover:text-amber-900 font-medium transition-colors"
      >
        <span>←</span>
        <span>返回任务大厅</span>
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
        {/* 头部：难度、状态、发布者 */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-600 px-8 py-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${difficultyStyles[task.difficulty]}`}>
              {task.difficulty}
            </span>
            <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${statusStyles[task.status]}`}>
              {task.status}
            </span>
            <div className="flex items-center gap-2 text-amber-100">
              <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-amber-900 text-xs font-bold">
                {task.publisher.name.charAt(0)}
              </div>
              <span className="text-sm">发布者：{task.publisher.name}</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">{task.title}</h1>
        </div>

        <div className="p-8">
          {/* 基础信息栏 */}
          <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-amber-50">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">发布者：</span>
              <span className="font-medium text-gray-800">{task.publisher.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">发布时间：</span>
              <span className="font-medium text-gray-800">{task.createdAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">任务时限：</span>
              <span className="font-medium text-gray-800">{task.deadline}</span>
            </div>
          </div>

          {/* 任务描述 */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
              任务描述
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          </div>

          {/* 技术需求标签 */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
              技术需求
            </h2>
            <div className="flex flex-wrap gap-2">
              {task.techRequirements.map((tech, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-100"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* 赏金与操作按钮 */}
          <div className="flex items-center justify-between pt-6 border-t border-amber-50">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💎</span>
              <span className="text-3xl font-bold text-amber-600">{task.reward}</span>
              <span className="text-gray-500">灵石</span>
            </div>

            {canAccept ? (
              <button
                onClick={onAccept}
                className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold rounded-xl shadow-md hover:from-amber-700 hover:to-amber-600 transition-all hover:shadow-lg active:scale-95"
              >
                接受委托
              </button>
            ) : (
              <button
                disabled
                className="px-8 py-3 bg-gray-200 text-gray-500 font-bold rounded-xl cursor-not-allowed"
              >
                {task.status === "已完成" ? "已完成" : task.status === "讨伐中" ? "进行中" : "审核中"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}