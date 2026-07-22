// app/api/client/index.ts

/**
 * 前端 API 客户端
 * 
 * 统一封装与后端的所有 HTTP 请求，包括：
 * - 基础配置（API 地址、本地存储键名）
 * - Token 管理（获取、设置、过期判断、刷新）
 * - 通用请求函数（自动注入 Bearer Token、处理 401 刷新与重试）
 * - 权限本地存储的读写工具
 * - 分模块 API：用户（userApi）、RBAC（rbacApi）、任务（taskApi）、宗门（sectApi）
 * 
 * 所有异步请求均基于 fetch，返回经过统一响应处理后的业务数据。
 */

import { User, LoginCredentials, RegisterData, LoginResponse, UserInfoResponse, BackendUser } from "@/types/user";
import { Task, TaskFilters } from "@/types/task";
import { Disciple, PeakInfo, CurrentUser, SectPeak } from "@/types/sect";
import { Role, Peak, Permission } from "@/types/rbac";

/* ------------------------------------------------------------------ */
/*  基础配置                                                         */
/* ------------------------------------------------------------------ */

/** 后端 API 基础地址 */
const API_BASE_URL = "http://localhost:8080/api";

/** 本地存储键名 */
const TOKEN_KEY = "fgscs_token";                    /// 访问令牌
const REFRESH_TOKEN_KEY = "fgscs_refresh_token";     /// 刷新令牌
const PERMISSIONS_KEY = "fgscs_permissions";         /// 权限缓存

/* ------------------------------------------------------------------ */
/*  Token 工具函数                                                   */
/* ------------------------------------------------------------------ */

/** 从本地存储获取 access token */
function getToken(): string | null {
  if (typeof window === "undefined") return null;    /// 服务端不执行
  return localStorage.getItem(TOKEN_KEY);
}

/** 写入 access token */
function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

/** 获取 refresh token */
function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** 写入 refresh token */
function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/** 清除所有 token（登出或过期时调用） */
function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** 简单判断 JWT 是否过期（客户端粗略判断，减少无效请求） */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));  /// 解码 payload
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;                                /// 解析失败视为过期
  }
}

/* ------------------------------------------------------------------ */
/*  Token 刷新                                                        */
/* ------------------------------------------------------------------ */

/** 刷新接口返回结构 */
type RefreshResponse = {
  code: number;
  message: string;
  data: {
    token: string;
    refreshToken?: string;
  };
};

/**
 * 使用 refresh token 获取新的 access token
 * @returns 刷新成功返回 true，失败返回 false
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/user/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();                            /// 失败直接清除
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

    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  统一请求封装                                                     */
/* ------------------------------------------------------------------ */

/** 后端统一响应结构 */
type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/**
 * 通用请求函数
 * @param endpoint  - API 路径（不含 base URL）
 * @param options   - fetch 配置项
 * @param requiresAuth - 是否需要认证（自动注入 token 并处理过期刷新）
 * @returns 解析出的 data 字段
 */
async function request<T>(
  endpoint: string,
  options?: RequestInit,
  requiresAuth: boolean = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  /* ---------- 认证处理 ---------- */
  if (requiresAuth) {
    const token = getToken();
    if (token) {
      if (isTokenExpired(token)) {
        // 过期则先尝试刷新
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const newToken = getToken();
          if (newToken) headers["Authorization"] = `Bearer ${newToken}`;
        } else {
          clearTokens();
          throw new Error("登录已过期，请重新登录");
        }
      } else {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } else {
      throw new Error("用户未登录");
    }
  }

  let res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  /* ---------- 401 处理：刷新重试一次 ---------- */
  if (res.status === 401 && requiresAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getToken();
      if (newToken) headers["Authorization"] = `Bearer ${newToken}`;
      // 重试请求
      res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
      if (res.status === 401) {
        clearTokens();
        throw new Error("登录已过期，请重新登录");
      }
    } else {
      clearTokens();
      throw new Error("登录已过期，请重新登录");
    }
  }

  /* ---------- 错误处理 ---------- */
  if (!res.ok) {
    try {
      const errorJson = await res.json();
      throw new Error(errorJson.message || `API Error: ${res.status}`);
    } catch (e) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
  }

  /* ---------- 解析统一响应 ---------- */
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 200) {
    throw new Error(json.message || `业务错误：code=${json.code}`);
  }
  return json.data;
}

/* ------------------------------------------------------------------ */
/*  权限本地存储管理                                                 */
/* ------------------------------------------------------------------ */

interface StoredPermissions {
  roleNames: string[];
  permissionNames: string[];
  peakIds: number[];
  isGlobal: boolean;
}

/** 将用户权限数据写入本地存储 */
function saveUserPermissions(data: StoredPermissions): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    PERMISSIONS_KEY,
    JSON.stringify({
      roleNames: Array.isArray(data.roleNames) ? data.roleNames : [],
      permissionNames: Array.isArray(data.permissionNames) ? data.permissionNames : [],
      peakIds: Array.isArray(data.peakIds) ? data.peakIds : [],
      isGlobal: typeof data.isGlobal === "boolean" ? data.isGlobal : false,
    })
  );
}

/** 清除本地存储的权限数据 */
function clearUserPermissions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PERMISSIONS_KEY);
}

/** 读取本地缓存的权限信息 */
export function getStoredPermissions(): StoredPermissions | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(PERMISSIONS_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (!parsed || !Array.isArray(parsed.roleNames) || !Array.isArray(parsed.permissionNames)) {
      clearUserPermissions();
      return null;
    }
    return parsed;
  } catch {
    clearUserPermissions();
    return null;
  }
}

/** 直接判断是否有某权限（基于本地缓存） */
export function hasPermission(permission: string): boolean {
  const perms = getStoredPermissions();
  if (!perms) return false;
  return perms.permissionNames.includes(permission);
}

/** 直接判断是否有某角色（基于本地缓存） */
export function hasRole(role: string): boolean {
  const perms = getStoredPermissions();
  if (!perms) return false;
  return perms.roleNames.includes(role);
}

/** 基于本地缓存判断是否拥有任意指定角色 */
export function hasAnyRole(...roles: string[]): boolean {
  const perms = getStoredPermissions();
  if (!perms) return false;
  return roles.some((r) => perms.roleNames.includes(r));
}

/** 基于本地缓存判断是否全局用户 */
export function isGlobalUser(): boolean {
  const perms = getStoredPermissions();
  if (!perms) return false;
  return perms.isGlobal;
}

/* ------------------------------------------------------------------ */
/*  用户 API                                                         */
/* ------------------------------------------------------------------ */

export const userApi = {
  /** 获取当前用户完整信息（需认证） */
  getCurrentUser: async (): Promise<UserInfoResponse> => {
    const data = await request<UserInfoResponse>("/user/me", undefined, true);
    saveUserPermissions(data);                    /// 成功时缓存权限
    return data;
  },

  /** 登录，成功后保存 token 和权限 */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const data = await request<LoginResponse>("/user/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (data.token) {
      setToken(data.token);
      saveUserPermissions(data);
    }
    return data;
  },

  /** 注册 */
  register: async (data: RegisterData): Promise<string> => {
    return request<string>("/user/register", {
      method: "POST",
      body: JSON.stringify({
        username: data.username,
        password: data.password,
        peak: data.peak || "无",
      }),
    });
  },

  /** 登出：调用后端接口后清除本地所有 token 和权限 */
  logout: async (): Promise<void> => {
    try {
      await request<void>("/user/logout", { method: "POST" }, true);
    } finally {
      clearTokens();
      clearUserPermissions();
    }
  },

  getToken,
  setToken,
  clearTokens,

  /** 客户端快速判断是否已认证（本地 token 存在且未过期） */
  isAuthenticated: (): boolean => {
    const token = getToken();
    return token !== null && !isTokenExpired(token);
  },
};

/* ------------------------------------------------------------------ */
/*  RBAC API                                                         */
/* ------------------------------------------------------------------ */

export const rbacApi = {
  /** 获取当前用户权限信息 */
  getMyPermissions: () => request<UserInfoResponse>("/rbac/my-permissions", undefined, true),

  /** 获取所有角色列表 */
  getAllRoles: () => request<Role[]>("/rbac/roles"),

  /** 获取所有峰（组织）列表 */
  getAllPeaks: () => request<Peak[]>("/rbac/peaks"),

  /** 获取指定用户的角色 */
  getUserRoles: (userId: string) => request<Role[]>(`/rbac/user/${userId}/roles`, undefined, true),

  /** 更新用户角色 */
  updateUserRoles: (userId: string, roleIds: string[], peakId?: string) => {
    const params = new URLSearchParams();
    roleIds.forEach((id) => params.append("roleIds", id));
    if (peakId) params.set("peakId", peakId);
    return request<void>(`/rbac/user/${userId}/roles?${params.toString()}`, { method: "PUT" }, true);
  },

  /** 获取用户细粒度权限列表 */
  getUserPermissions: (userId: string) =>
    request<Permission[]>(`/rbac/user/${userId}/permissions`, undefined, true),
};

/* ------------------------------------------------------------------ */
/*  任务 API                                                         */
/* ------------------------------------------------------------------ */

/** 创建任务请求体 */
export interface CreateTaskRequest {
  title: string;
  description: string;
  reward: number;
  difficulty: string;
}

export const taskApi = {
  /** 获取任务列表，支持筛选（不含认证要求，视后端实际可调整） */
  getTasks: (filters?: Partial<TaskFilters>) => {
    const params = new URLSearchParams();
    if (filters?.difficulty && filters.difficulty !== "全部难度") params.set("difficulty", filters.difficulty);
    if (filters?.status && filters.status !== "全部状态") params.set("status", filters.status);
    if (filters?.keyword) params.set("keyword", filters.keyword);
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<Task[]>(`/tasks${query}`);
  },

  /** 获取任务详情 */
  getTaskById: (id: string) => request<Task>(`/tasks/${id}`),

  /** 创建任务（发布悬赏）——需要认证 */
  createTask: (data: CreateTaskRequest) =>
    request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }, true),

  /** 获取待审核任务列表——需要认证 */
  getPendingTasks: () =>
    request<Task[]>("/tasks/pending", undefined, true),

  /** 审核通过任务——需要认证 */
  approveTask: (id: string) =>
    request<Task>(`/tasks/${id}/approve`, {
      method: "POST",
    }, true),

  /** 审核拒绝任务——需要认证 */
  rejectTask: (id: string, reason?: string) =>
    request<Task>(`/tasks/${id}/reject`, {
      method: "POST",
      body: reason ? JSON.stringify({ reason }) : undefined,
    }, true),
};

/* ------------------------------------------------------------------ */
/*  宗门 API                                                         */
/* ------------------------------------------------------------------ */

export const sectApi = {
  /** 当前用户宗门信息 */
  getCurrentUser: () => request<CurrentUser>("/sect/current-user", undefined, true),

  /** 所有弟子 */
  getAllDisciples: () => request<Disciple[]>("/sect/disciples"),

  /** 管理团队弟子 */
  getManagementDisciples: () => request<Disciple[]>("/sect/disciples/management"),

  /** 按峰获取弟子 */
  getDisciplesByPeak: (peak: SectPeak) => request<Disciple[]>(`/sect/disciples?peak=${peak}`),

  /** 所有峰信息 */
  getAllPeaks: () => request<PeakInfo[]>("/sect/peaks"),

  /** 搜索弟子 */
  searchDisciples: (keyword: string) =>
    request<Disciple[]>(`/sect/disciples/search?keyword=${encodeURIComponent(keyword)}`),

  /** 按峰筛选弟子（含“全部”） */
  filterDisciplesByPeak: (peak: SectPeak | "全部") => request<Disciple[]>(`/sect/disciples?peak=${peak}`),

  /** 移动弟子到另一峰 */
  moveDisciplePeak: (discipleId: string, newPeak: SectPeak) =>
    request<boolean>(`/sect/disciples/${discipleId}/move`, {
      method: "PUT",
      body: JSON.stringify({ peak: newPeak }),
    }, true),

  /** 删除弟子 */
  deleteDisciple: (discipleId: string) =>
    request<boolean>(`/sect/disciples/${discipleId}`, { method: "DELETE" }, true),

  /** 打赏弟子灵石 */
  rewardDisciple: (discipleId: string, amount: number) =>
    request<boolean>(`/sect/disciples/${discipleId}/reward`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }, true),

  /** 添加新弟子 */
  addDisciple: (disciple: Omit<Disciple, "id">) =>
    request<Disciple>("/sect/disciples", {
      method: "POST",
      body: JSON.stringify(disciple),
    }, true),
};