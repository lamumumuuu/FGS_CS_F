// app/api/client/core/permissions.ts

/**
 * 权限本地存储管理模块
 * 
 * 提供用户权限数据的本地缓存读写功能，支持基于缓存的权限判断。
 */

const PERMISSIONS_KEY = "fgscs_permissions";

/** 本地存储的权限数据结构 */
export interface StoredPermissions {
  roleNames: string[];
  permissionNames: string[];
  peakIds: number[];
  isGlobal: boolean;
}

/**
 * 将用户权限数据写入本地存储
 * @param data - 权限数据对象
 */
export function saveUserPermissions(data: StoredPermissions): void {
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

/**
 * 清除本地存储的权限数据
 */
export function clearUserPermissions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PERMISSIONS_KEY);
}

/**
 * 读取本地缓存的权限信息
 * @returns 权限数据对象，未登录或无缓存返回 null
 */
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

/**
 * 基于本地缓存判断是否拥有指定权限
 * @param permission - 权限标识
 * @returns true 表示拥有该权限，false 表示不拥有或未登录
 */
export function hasPermission(permission: string): boolean {
  const perms = getStoredPermissions();
  if (!perms) return false;
  return perms.permissionNames.includes(permission);
}

/**
 * 基于本地缓存判断是否拥有指定角色
 * @param role - 角色标识
 * @returns true 表示拥有该角色，false 表示不拥有或未登录
 */
export function hasRole(role: string): boolean {
  const perms = getStoredPermissions();
  if (!perms) return false;
  return perms.roleNames.includes(role);
}

/**
 * 基于本地缓存判断是否拥有任意指定角色
 * @param roles - 角色标识列表
 * @returns true 表示拥有任意一个角色，false 表示都不拥有或未登录
 */
export function hasAnyRole(...roles: string[]): boolean {
  const perms = getStoredPermissions();
  if (!perms) return false;
  return roles.some((r) => perms.roleNames.includes(r));
}

/**
 * 基于本地缓存判断是否全局用户
 * @returns true 表示是全局用户，false 表示不是或未登录
 */
export function isGlobalUser(): boolean {
  const perms = getStoredPermissions();
  if (!perms) return false;
  return perms.isGlobal;
}