// app/api/client/core/request.ts

/**
 * 统一请求封装模块
 * 
 * 提供通用的 fetch 请求封装，自动处理：
 * - 请求头设置（Content-Type: application/json）
 * - JWT Token 自动注入（需要认证的接口）
 * - Token 过期自动检测和刷新重试
 * - 统一响应格式解析
 * - 错误状态码处理
 */

import { getToken, isTokenExpired, refreshAccessToken, clearTokens } from "./token";
import { API_BASE_URL } from "./config";

/** 后端统一响应结构 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/**
 * 通用请求函数
 * @param endpoint - API 路径（不含 base URL）
 * @param options - fetch 配置项
 * @param requiresAuth - 是否需要认证（自动注入 token 并处理过期刷新）
 * @returns 解析出的 data 字段
 * @throws Error - 请求失败或业务错误时抛出
 */
export async function request<T>(
  endpoint: string,
  options?: RequestInit,
  requiresAuth: boolean = false
): Promise<T> {
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

  if (res.status === 401 && requiresAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getToken();
      if (newToken) headers["Authorization"] = `Bearer ${newToken}`;
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

  if (!res.ok) {
    // 处理权限不足错误 (403)
    if (res.status === 403) {
      // 尝试从响应中获取更详细的错误信息
      let message = "权限不足：您没有执行此操作的权限";
      try {
        const errorJson = await res.json();
        if (errorJson.message) {
          message = errorJson.message;
        }
      } catch {
        // 忽略 JSON 解析错误
      }
      
      // 触发全局权限不足事件（可通过 window 事件监听）
      if (typeof window !== "undefined") {
        const event = new CustomEvent("permission-denied", { detail: { message } });
        window.dispatchEvent(event);
      }
      
      throw new Error(message);
    }

    try {
      const errorJson = await res.json();
      throw new Error(errorJson.message || `API Error: ${res.status}`);
    } catch (e) {
      if (e instanceof Error && e.message.includes("权限不足")) {
        throw e; // 保留已处理的权限错误
      }
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
  }

  const json: ApiResponse<T> = await res.json();
  if (json.code !== 200) {
    throw new Error(json.message || `业务错误：code=${json.code}`);
  }
  return json.data;
}