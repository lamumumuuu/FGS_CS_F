// types/user.ts

import { SectRole, SectPeak, SectPermission } from "./sect";
import { Role, Peak, UserPermissions, Permission as RbacPermission } from "./rbac";

/** 前端当前用户状态 */
export interface User {
  id: string;
  username: string;
  studentId: string;
  avatar?: string;
  role: SectRole | null;
  peak: SectPeak | null;
  title: string | null;
  lingshi: number;
  joinDate: string;
  isLoggedIn: boolean;
  permissions: SectPermission[];
}

/** 登录表单 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/** 注册表单 */
export interface RegisterData {
  username: string;
  password: string;
  studentId?: string;
  peak?: string
}

/** 登录接口响应 */
export interface LoginResponse {
  token: string;
  user: BackendUser;
  roles: Role[];
  roleNames: string[];
  permissions: RbacPermission[];
  permissionNames: string[];
  peakIds: number[];
  isGlobal: boolean;
}

/** 后端返回的用户原始字段 */
export interface BackendUser {
  id: string;
  username: string;
  avatar?: string;
  role: number;
  status: number;
  createTime?: string;
  updateTime?: string;
  lastLoginTime?: string;
  lingshi?: number;
}

/** 用户信息刷新接口响应（不含 token） */
export interface UserInfoResponse {
  user: BackendUser;
  roles: Role[];
  roleNames: string[];
  permissions: RbacPermission[];
  permissionNames: string[];
  peakIds: number[];
  isGlobal: boolean;
}