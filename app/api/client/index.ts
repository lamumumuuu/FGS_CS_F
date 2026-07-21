import { User, LoginCredentials, RegisterData } from "@/types/user";
import { Task, TaskFilters } from "@/types/task";
import { Disciple, PeakInfo, CurrentUser, SectPeak } from "@/types/sect";

const API_BASE_URL = "http://localhost:8080/api";

const TOKEN_KEY = "fgscs_token";
const REFRESH_TOKEN_KEY = "fgscs_refresh_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/user/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        if (data.refreshToken) {
          setRefreshToken(data.refreshToken);
        }
        return true;
      }
    }
  } catch {
    // ignore
  }

  clearTokens();
  return false;
}

async function request<T>(endpoint: string, options?: RequestInit, requiresAuth: boolean = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) {
      if (isTokenExpired(token)) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const newToken = getToken();
          if (newToken) {
            headers["Authorization"] = `Bearer ${newToken}`;
          }
        }
      } else {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && requiresAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
      }
      const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
      if (!retryRes.ok) {
        if (retryRes.status === 401) {
          clearTokens();
        }
        throw new Error(`API Error: ${retryRes.status} ${retryRes.statusText}`);
      }
      return retryRes.json();
    } else {
      clearTokens();
    }
  }

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const userApi = {
  getCurrentUser: () => request<User>("/user/me", undefined, true),

  login: async (credentials: LoginCredentials): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.token) {
      setToken(data.token);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data.user || data;
  },

  register: async (data: RegisterData): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/user/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();
    if (result.token) {
      setToken(result.token);
    }
    if (result.refreshToken) {
      setRefreshToken(result.refreshToken);
    }
    return result.user || result;
  },

  logout: async (): Promise<void> => {
    try {
      await request<void>("/user/logout", { method: "POST" }, true);
    } finally {
      clearTokens();
    }
  },

  getToken,
  setToken,
  clearTokens,
  isAuthenticated: (): boolean => {
    const token = getToken();
    return token !== null && !isTokenExpired(token);
  },
};

export const taskApi = {
  getTasks: (filters?: Partial<TaskFilters>) => {
    const params = new URLSearchParams();
    if (filters?.difficulty && filters.difficulty !== "全部难度") params.set("difficulty", filters.difficulty);
    if (filters?.status && filters.status !== "全部状态") params.set("status", filters.status);
    if (filters?.keyword) params.set("keyword", filters.keyword);
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<Task[]>(`/tasks${query}`);
  },

  getTaskById: (id: string) => request<Task>(`/tasks/${id}`),
};

export const sectApi = {
  getCurrentUser: () => request<CurrentUser>("/sect/current-user", undefined, true),

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
    }, true),

  deleteDisciple: (discipleId: string) =>
    request<boolean>(`/sect/disciples/${discipleId}`, {
      method: "DELETE",
    }, true),

  rewardDisciple: (discipleId: string, amount: number) =>
    request<boolean>(`/sect/disciples/${discipleId}/reward`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }, true),

  addDisciple: (disciple: Omit<Disciple, "id">) =>
    request<Disciple>("/sect/disciples", {
      method: "POST",
      body: JSON.stringify(disciple),
    }, true),
};
