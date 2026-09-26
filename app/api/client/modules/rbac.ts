// app/api/client/modules/rbac.ts

/**
 * RBAC（角色权限管理）API 模块
 * 
 * 提供角色、权限、峰（组织）相关的管理接口，支持权限查询和用户角色配置。
 */

import { UserInfoResponse } from "@/types/user";
import { Role, Peak, Permission } from "@/types/rbac";
import { request } from "../core/request";

export const rbacApi = {
  /**
   * 获取当前用户权限信息（需认证）
   * 
   * @returns 用户权限信息
   * @throws Error - 用户未登录时抛出
   * 
   * 使用场景：权限系统初始化或刷新时获取当前用户的完整权限数据。
   */
  getMyPermissions: () => request<UserInfoResponse>("/rbac/my-permissions", undefined, true),

  /**
   * 获取所有角色列表（需认证）
   * 
   * @returns 角色列表
   * @throws Error - 用户未登录或无权限时抛出
   * 
   * 使用场景：管理后台角色选择器或角色管理页面展示所有可用角色。
   */
  getAllRoles: () => request<Role[]>("/rbac/roles", undefined, true),

  /**
   * 获取所有峰（组织）列表（需认证）
   * 
   * @returns 峰列表
   * @throws Error - 用户未登录或无权限时抛出
   * 
   * 使用场景：组织管理页面展示所有峰信息，或弟子分配时选择目标峰。
   */
  getAllPeaks: () => request<Peak[]>("/rbac/peaks", undefined, true),

  /**
   * 添加新峰（需认证）
   * 
   * @param name - 峰名称
   * @param description - 峰描述
   * @returns 创建的峰对象
   * @throws Error - 用户未登录、无权限或参数错误时抛出
   * 
   * 使用场景：宗门事务页面创建新峰。
   */
  addPeak: (name: string, description?: string) =>
    request<Peak>("/rbac/peaks", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }, true),

  /**
   * 删除峰（需认证）
   * 
   * @param id - 峰 ID
   * @returns true 表示删除成功
   * @throws Error - 用户未登录、无权限、峰不存在或峰下有弟子时抛出
   * 
   * 使用场景：宗门事务页面删除空峰。
   */
  deletePeak: (id: string) =>
    request<boolean>(`/rbac/peaks/${id}`, { method: "DELETE" }, true),

  /**
   * 获取指定用户的角色（需认证）
   * 
   * @param userId - 用户 ID
   * @returns 用户的角色列表
   * @throws Error - 用户未登录或无权限时抛出
   * 
   * 使用场景：查看特定用户的角色配置。
   */
  getUserRoles: (userId: string) => request<Role[]>(`/rbac/user/${userId}/roles`, undefined, true),

  /**
   * 更新用户角色（需认证）
   * 
   * @param userId - 用户 ID
   * @param roleIds - 角色 ID 列表
   * @param peakId - 峰 ID（可选）
   * @returns void
   * @throws Error - 用户未登录、无权限或参数错误时抛出
   * 
   * 使用场景：管理员在用户管理页面调整用户角色分配。
   * 业务逻辑：通过 URL 查询参数传递角色 ID 列表和峰 ID。
   */
  updateUserRoles: (userId: string, roleIds: string[], peakId?: string) => {
    const params = new URLSearchParams();
    roleIds.forEach((id) => params.append("roleIds", id));
    if (peakId) params.set("peakId", peakId);
    return request<void>(`/rbac/user/${userId}/roles?${params.toString()}`, { method: "PUT" }, true);
  },

  /**
   * 获取用户细粒度权限列表（需认证）
   * 
   * @param userId - 用户 ID
   * @returns 用户的权限列表
   * @throws Error - 用户未登录或无权限时抛出
   * 
   * 使用场景：查看特定用户拥有的所有细粒度权限。
   */
  getUserPermissions: (userId: string) =>
    request<Permission[]>(`/rbac/user/${userId}/permissions`, undefined, true),

  /**
   * 获取所有权限列表（需认证）
   * 
   * @returns 权限列表
   * @throws Error - 用户未登录或无权限时抛出
   * 
   * 使用场景：角色权限管理页面展示所有可用权限。
   */
  getAllPermissions: () => request<Permission[]>("/rbac/permissions", undefined, true),

  /**
   * 获取角色权限（需认证）
   * 
   * @param roleId - 角色 ID
   * @returns 角色的权限列表
   * @throws Error - 用户未登录或无权限时抛出
   * 
   * 使用场景：角色权限管理页面展示指定角色的权限配置。
   */
  getRolePermissions: (roleId: string) =>
    request<Permission[]>(`/rbac/roles/${roleId}/permissions`, undefined, true),

  /**
   * 更新角色权限（需认证）
   * 
   * @param roleId - 角色 ID
   * @param permissionIds - 权限 ID 列表
   * @returns void
   * @throws Error - 用户未登录、无权限或参数错误时抛出
   * 
   * 使用场景：角色权限管理页面更新角色的权限配置。
   */
  updateRolePermissions: (roleId: string, permissionIds: string[]) =>
    request<void>(`/rbac/roles/${roleId}/permissions`, {
      method: "PUT",
      body: JSON.stringify(permissionIds),
    }, true),
};