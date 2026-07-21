"use client";

import { Task, TaskDifficulty, TaskStatus } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const difficultyStyles: Record<TaskDifficulty, string> = {
 黑铁: "bg-gray-700 text-gray-100",
 青铜: "bg-amber-700 text-amber-50",
 白银: "bg-slate-400 text-slate-900",
 黄金: "bg-yellow-500 text-yellow-900",
};

const statusStyles: Record<TaskStatus, string> = {
 审核中: "bg-blue-100 text-blue-700 border-blue-200",
 等待中: "bg-green-100 text-green-700 border-green-200",
 讨伐中: "bg-orange-100 text-orange-700 border-orange-200",
 已完成: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function TaskCard({ task, onClick }: TaskCardProps) {
 const isCompleted = task.status === "已完成";

 return (
 <div
 onClick={onClick}
 className={`bg-white rounded-xl shadow-md border border-amber-100 p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-amber-300 ${
 isCompleted ? "opacity-80" : ""
 }`}
 >
 <div className="flex items-start justify-between mb-3">
 <span
 className={`px-3 py-1 rounded-full text-xs font-bold ${difficultyStyles[task.difficulty]}`}
 >
 {task.difficulty}
 </span>
 <span
 className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[task.status]}`}
 >
 {task.status}
 </span>
 </div>

 <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">
 {task.title}
 </h3>

 <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
 {task.description}
 </p>

 {isCompleted && task.completer && (
 <div className="flex items-center gap-2 mb-4 p-2 bg-green-50 rounded-lg border border-green-100">
 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
 {task.completer.name.charAt(0)}
 </div>
 <div className="text-sm">
 <span className="text-green-700 font-medium">完成者：</span>
 <span className="text-green-600">{task.completer.name}</span>
 </div>
 </div>
 )}

 <div className="flex items-end justify-between pt-3 border-t border-amber-50">
 <div className="flex items-center gap-1 text-amber-600">
 <span className="text-lg">💎</span>
 <span className="font-bold text-lg">{task.reward}</span>
 <span className="text-sm text-amber-500">灵石</span>
 </div>
 <div className="text-sm text-gray-500">
 <span>⏰ {task.deadline}</span>
 </div>
 </div>
 </div>
 );
}
