import { Task, TaskFilters } from "@/types/task";

export async function fetchTasks(filters?: Partial<TaskFilters>): Promise<Task[]> {
  throw new Error("Mock service deprecated. Use taskApi from @/app/api/client instead.");
}

export async function fetchTaskById(id: string): Promise<Task | null> {
  throw new Error("Mock service deprecated. Use taskApi from @/app/api/client instead.");
}
