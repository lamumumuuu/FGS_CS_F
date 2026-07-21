export type TaskDifficulty = "黑铁" | "青铜" | "白银" | "黄金";
export type TaskStatus = "审核中" | "等待中" | "讨伐中" | "已完成";

export interface TaskPublisher {
  id: string;
  name: string;
  avatar: string;
}

export interface TaskCompleter {
  id: string;
  name: string;
  avatar: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  reward: number;
  deadline: string;
  publisher: TaskPublisher;
  createdAt: string;
  techRequirements: string[];
  completer?: TaskCompleter;
}

export interface TaskFilters {
  difficulty: TaskDifficulty | "全部难度";
  status: TaskStatus | "全部状态";
  keyword: string;
}
