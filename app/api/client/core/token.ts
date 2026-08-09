// app/api/client/core/token.ts

/**
 * Token 管理模块
 * 
 * 提供 Access Token 和 Refresh Token 的本地存储管理、过期判断及刷新功能。
 */

const API_BASE_URL = "http://localhost:8080/api";
const TOKEN_KEY = "fgscs_token";
const REFRESH_TOKEN_KEY = "fgscs_refresh_token";

/**
 * 从本地存储获取 access token
 * @returns access token 字符串，未登录返回 null
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 写入 access token 到本地存储
 * @param token - 要存储的 access token
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 从本地存储获取 refresh token
 * @returns refresh token 字符串，未登录返回 null
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * 写入 refresh token 到本地存储
 * @param token - 要存储的 refresh token
 */
export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * 清除所有 token（登出或过期时调用）
 */
export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * 简单判断 JWT 是否过期（客户端粗略判断，减少无效请求）
 * @param token - JWT token 字符串
 * @returns true 表示已过期，false 表示未过期
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

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
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/user/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
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

    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}