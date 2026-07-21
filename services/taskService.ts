import { Task, TaskFilters } from "@/types/task";
import { mockTasks } from "@/data/mockTasks";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchTasks(filters?: Partial<TaskFilters>): Promise<Task[]> {
  await delay(300);

  let result = [...mockTasks];

  if (filters?.difficulty && filters.difficulty !== "全部难度") {
    result = result.filter((task) => task.difficulty === filters.difficulty);
  }

  if (filters?.status && filters.status !== "全部状态") {
    result = result.filter((task) => task.status === filters.status);
  }

  if (filters?.keyword) {
    const keyword = filters.keyword.toLowerCase();
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(keyword) ||
        task.description.toLowerCase().includes(keyword)
    );
  }

  return result;
}

export async function fetchTaskById(id: string): Promise<Task | null> {
  await delay(200);
  const task = mockTasks.find((t) => t.id === id);
  return task || null;
}
