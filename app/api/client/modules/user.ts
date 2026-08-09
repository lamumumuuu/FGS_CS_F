// app/api/client/modules/user.ts

/**
 * 用户认证 API 模块
 * 
 * 提供用户登录、注册、获取用户信息、登出等认证相关接口。
 */

import { User, LoginCredentials, RegisterData, LoginResponse, UserInfoResponse } from "@/types/user";
import { request } from "../core/request";
import { setToken, clearTokens, getToken, isTokenExpired } from "../core/token";
import { saveUserPermissions, clearUserPermissions } from "../core/permissions";

export const userApi = {
  /**
   * 获取当前用户完整信息（需认证）
   * 
   * @returns 用户信息及权限数据
   * @throws Error - 用户未登录或请求失败时抛出
   * 
   * 使用场景：页面初始化时获取当前登录用户信息，用于展示个人资料和权限判断。
   * 业务逻辑：请求成功后自动缓存用户权限到本地存储。
   */
  getCurrentUser: async (): Promise<UserInfoResponse> => {
    const data = await request<UserInfoResponse>("/user/me", undefined, true);
    saveUserPermissions(data);
    return data;
  },

  /**
   * 用户登录
   * 
   * @param credentials - 登录凭证（用户名和密码）
   * @returns 登录响应数据（包含 token 和用户信息）
   * @throws Error - 用户名或密码错误时抛出
   * 
   * 使用场景：用户在登录页面提交登录表单时调用。
   * 业务逻辑：登录成功后自动保存 token 到本地存储，并缓存用户权限信息。
   */
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

  /**
   * 用户注册
   * 
   * @param data - 注册信息（用户名、密码、学号、所属峰）
   * @returns 注册成功消息
   * @throws Error - 用户名已存在或验证失败时抛出
   * 
   * 使用场景：新用户在注册页面提交注册表单时调用。
   * 业务逻辑：前端仅发送 username、password、peak 字段，studentId 字段当前未发送。
   */
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

  /**
   * 用户登出
   * 
   * @returns void
   * 
   * 使用场景：用户点击退出登录按钮时调用。
   * 业务逻辑：调用后端登出接口后，清除本地存储的所有 token 和权限数据。
   * 注意：即使后端接口调用失败，仍会清除本地数据以确保客户端状态正确。
   */
  logout: async (): Promise<void> => {
    try {
      await request<void>("/user/logout", { method: "POST" }, true);
    } finally {
      clearTokens();
      clearUserPermissions();
    }
  },

  /**
   * 获取当前存储的 access token
   * 
   * @returns access token 字符串，未登录返回 null
   */
  getToken,

  /**
   * 设置 access token
   * 
   * @param token - 要存储的 access token
   */
  setToken,

  /**
   * 清除所有 token
   */
  clearTokens,

  /**
   * 客户端快速判断是否已认证（本地 token 存在且未过期）
   * 
   * @returns true 表示已认证且 token 有效，false 表示未认证或 token 过期
   * 
   * 使用场景：页面路由守卫或组件渲染前判断用户登录状态。
   * 注意：此判断基于本地缓存，不保证服务端验证通过。
   */
  isAuthenticated: (): boolean => {
    const token = getToken();
    return token !== null && !isTokenExpired(token);
  },
};