import { User, LoginCredentials, RegisterData } from "@/types/user";
import { Task, TaskFilters } from "@/types/task";
import { Disciple, PeakInfo, CurrentUser, SectPeak } from "@/types/sect";

// ========== 与文档一致：基础 URL ==========
const API_BASE_URL = "http://localhost:8080/api";

// ========== Token 本地存储键名（文档要求） ==========
const TOKEN_KEY = "fgscs_token";
const REFRESH_TOKEN_KEY = "fgscs_refresh_token"; // 扩展字段，与后端约定一致即可

// ========== Token 工具函数（与文档一致） ==========

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

// 简单判断 token 是否过期（客户端粗略判断，减少无效请求）
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// ========== 刷新 Token 的接口（修复 any） ==========

// 刷新接口返回结构
type RefreshResponse = {
  code: number;
  message: string;
  data: {
    token: string;
    refreshToken?: string;
  };
};

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    // 注意：文档要求调用 /user/refresh，刷新接口也可能需要统一返回 { code, message, data }
    const res = await fetch(`${API_BASE_URL}/user/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      // 401/403 等情况直接清除 token，避免无限重试
      clearTokens();
      return false;
    }

    const resp: RefreshResponse = await res.json();

    if (resp.code === 200 && resp.data?.token) {
      setToken(resp.data.token);
      if (resp.data.refreshToken) {
        setRefreshToken(resp.data.refreshToken);
      }
      return true;
    }

    // code 不是 200 也视为失败
    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

// ========== 统一请求封装 ==========

// 统一响应结构
type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

// 登录 / 注册 返回结构
type AuthResponse = {
  user: User;
  token?: string;
  refreshToken?: string;
};

async function request<T>(
  endpoint: string,
  options?: RequestInit,
  requiresAuth: boolean = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  // 需要认证的接口：自动注入 Bearer Token
  if (requiresAuth) {
    const token = getToken();
    if (token) {
      if (isTokenExpired(token)) {
        // token 过期时尝试刷新
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const newToken = getToken();
          if (newToken) {
            headers["Authorization"] = `Bearer ${newToken}`;
          }
        } else {
          // 刷新失败，清除本地登录状态
          clearTokens();
          throw new Error("登录已过期，请重新登录");
        }
      } else {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } else {
      // 没有 token，直接提示未登录
      throw new Error("用户未登录");
    }
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 处理 401：尝试刷新一次，然后重试
  if (res.status === 401) {
    if (requiresAuth) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newToken = getToken();
        if (newToken) {
          headers["Authorization"] = `Bearer ${newToken}`;
        }
        // 重试时不再走自动刷新，避免死循环
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
        // 统一解析 { code, message, data }
        const json: ApiResponse<T> = await retryRes.json();
        if (json.code !== 200) {
          throw new Error(json.message || `业务错误：code=${json.code}`);
        }
        return json.data;
      } else {
        clearTokens();
        throw new Error("登录已过期，请重新登录");
      }
    } else {
      // 不需要认证的接口返回 401 直接报错
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
  }

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  // 按文档统一解析响应
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 200) {
    throw new Error(json.message || `业务错误：code=${json.code}`);
  }
  return json.data;
}

// ========== 用户相关 API（修复 any） ==========

export const userApi = {
  getCurrentUser: () => request<User>("/user/me", undefined, true),

  // 建议统一走 request 封装，保证返回结构一致
  login: async (credentials: LoginCredentials): Promise<User> => {
    // 注意：后端登录接口路径可能是 /api/user/login，具体以你的 Controller 为准
    const data = await request<AuthResponse>(
      "/user/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
      false // 登录不需要认证
    );

    // 根据后端真实返回结构，保存 token
    if (data.token) {
      setToken(data.token);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data.user;
  },

  register: async (data: RegisterData): Promise<User> => {
    const result = await request<AuthResponse>(
      "/user/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
    if (result.token) {
      setToken(result.token);
    }
    if (result.refreshToken) {
      setRefreshToken(result.refreshToken);
    }
    return result.user;
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

// ========== 任务相关 API（示例，按你实际接口调整） ==========

export const taskApi = {
  getTasks: (filters?: Partial<TaskFilters>) => {
    const params = new URLSearchParams();
    if (filters?.difficulty && filters.difficulty !== "全部难度") {
      params.set("difficulty", filters.difficulty);
    }
    if (filters?.status && filters.status !== "全部状态") {
      params.set("status", filters.status);
    }
    if (filters?.keyword) {
      params.set("keyword", filters.keyword);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<Task[]>(`/tasks${query}`); // 是否需要认证视后端设计而定
  },

  getTaskById: (id: string) => request<Task>(`/tasks/${id}`),
};

// ========== Sect 相关 API（示例，按你实际接口调整） ==========

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
    request<boolean>(
      `/sect/disciples/${discipleId}/move`,
      {
        method: "PUT",
        body: JSON.stringify({ peak: newPeak }),
      },
      true
    ),

  deleteDisciple: (discipleId: string) =>
    request<boolean>(
      `/sect/disciples/${discipleId}`,
      {
        method: "DELETE",
      },
      true
    ),

  rewardDisciple: (discipleId: string, amount: number) =>
    request<boolean>(
      `/sect/disciples/${discipleId}/reward`,
      {
        method: "POST",
        body: JSON.stringify({ amount }),
      },
      true
    ),

  addDisciple: (disciple: Omit<Disciple, "id">) =>
    request<Disciple>(
      "/sect/disciples",
      {
        method: "POST",
        body: JSON.stringify(disciple),
      },
      true
    ),
};
