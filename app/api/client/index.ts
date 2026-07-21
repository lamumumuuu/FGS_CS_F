import { User, LoginCredentials, RegisterData } from "@/types/user";
import { Task, TaskFilters } from "@/types/task";
import { Disciple, PeakInfo, CurrentUser, SectPeak } from "@/types/sect";

const API_BASE_URL = "/api";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const userApi = {
  getCurrentUser: () => request<User>("/user/me"),

  login: (credentials: LoginCredentials) =>
    request<User>("/user/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (data: RegisterData) =>
    request<User>("/user/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<void>("/user/logout", { method: "POST" }),
};

export const taskApi = {
  getTasks: (filters?: Partial<TaskFilters>) => {
    const params = new URLSearchParams();
    if (filters?.difficulty) params.set("difficulty", filters.difficulty);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.keyword) params.set("keyword", filters.keyword);
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<Task[]>(`/tasks${query}`);
  },

  getTaskById: (id: string) => request<Task>(`/tasks/${id}`),
};

export const sectApi = {
  getCurrentUser: () => request<CurrentUser>("/sect/current-user"),

  getAllDisciples: () => request<Disciple[]>("/sect/disciples"),

  getManagementDisciples: () => request<Disciple[]>("/sect/disciples/management"),

  getDisciplesByPeak: (peak: SectPeak) =>
    request<Disciple[]>(`/sect/disciples?peak=${peak}`),

  getAllPeaks: () => request<PeakInfo[]>("/sect/peaks"),

  searchDisciples: (keyword: string) =>
    request<Disciple[]>(`/sect/disciples/search?keyword=${encodeURIComponent(keyword)}`),

  filterDisciplesByPeak: (peak: SectPeak | "全部") =>
    request<Disciple[]>(`/sect/disciples?peak=${peak}`),

  moveDisciplePeak: (discipleId: string, newPeak: SectPeak) =>
    request<boolean>(`/sect/disciples/${discipleId}/move`, {
      method: "PUT",
      body: JSON.stringify({ peak: newPeak }),
    }),

  deleteDisciple: (discipleId: string) =>
    request<boolean>(`/sect/disciples/${discipleId}`, {
      method: "DELETE",
    }),

  rewardDisciple: (discipleId: string, amount: number) =>
    request<boolean>(`/sect/disciples/${discipleId}/reward`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  addDisciple: (disciple: Omit<Disciple, "id">) =>
    request<Disciple>("/sect/disciples", {
      method: "POST",
      body: JSON.stringify(disciple),
    }),
};
