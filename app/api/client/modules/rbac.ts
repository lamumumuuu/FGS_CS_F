// app/api/client/modules/rbac.ts

/**
 * RBAC（角色权限管理）API 模块
 *
 * 读：/api/admin/roles、/api/admin/permissions（同源 BFF → FastAPI /admin/*）
 * 写：/api/admin/roles/{id}/permissions（整组替换，权限名为 resource:action）
 *
 */

import { Role, Peak, Permission } from "@/types/rbac";
import { nativeRequest } from "../core/native";

interface AdminRoleRow {
  id: number;
  name: string;
  displayName?: string | null;
  fantasyDisplayName?: string | null;
  description?: string | null;
  isSystem?: boolean;
  isProtected?: boolean;
  sortOrder?: number;
  permissions?: string[];
  userCount?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** 创建/更新角色入参（name 仅创建时提交）。 */
export interface RoleInput {
  name?: string;
  displayName: string;
  fantasyDisplayName?: string;
  description?: string;
}

interface AdminPermissionRow {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string | null;
}

export interface UserBinding {
  roleId: number;
  scopeType: "own" | "peak" | "all";
  scopePeakId?: number | null;
}

export interface UserBindingsResult {
  userId: number;
  authorizationVersion: number;
  bindings: Array<UserBinding & { id?: number; roleName?: string; displayName?: string }>;
}

function toRole(row: AdminRoleRow): Role {
  return {
    id: String(row.id),
    name: row.name,
    displayName: row.fantasyDisplayName || row.displayName || row.name,
    baseDisplayName: row.displayName ?? row.name,
    fantasyDisplayName: row.fantasyDisplayName ?? undefined,
    description: row.description ?? undefined,
    level: Number(row.sortOrder ?? 0),
    isSystem: row.isSystem ? 1 : 0,
    isProtected: row.isProtected ?? false,
    userCount: row.userCount ?? 0,
    createTime: row.createdAt ?? undefined,
    updateTime: row.updatedAt ?? undefined,
  };
}

function toPermission(row: AdminPermissionRow): Permission {
  return {
    id: row.name,
    name: row.name,
    displayName: row.description || row.name,
    module: row.resource,
    description: row.description ?? undefined,
  };
}

async function listRoleRows(): Promise<AdminRoleRow[]> {
  const body = await nativeRequest<AdminRoleRow[]>("/api/admin/roles");
  return Array.isArray(body) ? body : [];
}

async function listPermissionRows(): Promise<AdminPermissionRow[]> {
  const body = await nativeRequest<AdminPermissionRow[]>("/api/admin/permissions");
  return Array.isArray(body) ? body : [];
}

export const rbacApi = {
  /** 角色列表（含每个角色的权限名） */
  getAllRoles: async (): Promise<Role[]> => {
    const rows = await listRoleRows();
    return rows.map(toRole);
  },

  /** 权限点列表（name = resource:action） */
  getAllPermissions: async (): Promise<Permission[]> => {
    const rows = await listPermissionRows();
    return rows.map(toPermission);
  },

  /** 角色权限：从角色行读取权限名并映射为权限点 */
  getRolePermissions: async (roleId: string): Promise<Permission[]> => {
    const [roles, permissions] = await Promise.all([listRoleRows(), listPermissionRows()]);
    const names = roles.find((role) => String(role.id) === roleId)?.permissions ?? [];
    const byName = new Map(permissions.map((item) => [item.name, item]));
    return names.map((name) => {
      const row = byName.get(name);
      if (row) return toPermission(row);
      const [resource, action = ""] = name.split(":");
      return {
        id: name,
        name,
        displayName: name,
        module: resource,
        description: action,
      };
    });
  },

  /** 整组替换角色权限（提交权限名列表） */
  updateRolePermissions: async (roleId: string, permissionIds: string[]): Promise<void> => {
    await nativeRequest(`/api/admin/roles/${roleId}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions: permissionIds }),
    });
  },

  /** 创建自定义角色（key + 双展示名 + 描述） */
  createRole: async (input: RoleInput): Promise<Role> => {
    const row = await nativeRequest<AdminRoleRow>("/api/admin/roles", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        display_name: input.displayName,
        fantasy_display_name: input.fantasyDisplayName || null,
        description: input.description || null,
        permissions: [],
      }),
    });
    return toRole(row);
  },

  /** 更新角色展示名/描述（不改 key） */
  updateRole: async (roleId: string, input: Omit<RoleInput, "name">): Promise<Role> => {
    const row = await nativeRequest<AdminRoleRow>(`/api/admin/roles/${roleId}`, {
      method: "PATCH",
      body: JSON.stringify({
        display_name: input.displayName,
        fantasy_display_name: input.fantasyDisplayName || null,
        description: input.description || null,
      }),
    });
    return toRole(row);
  },

  /** 删除角色（系统/保护角色由后端拒绝） */
  deleteRole: async (roleId: string): Promise<void> => {
    await nativeRequest(`/api/admin/roles/${roleId}`, { method: "DELETE" });
  },

  /** 读取用户角色绑定与授权版本 */
  getUserBindings: async (userId: number): Promise<UserBindingsResult> => {
    return nativeRequest<UserBindingsResult>(`/api/admin/users/${userId}/role-bindings`);
  },

  /** 整组替换用户角色绑定（If-Match 由 BFF 携带） */
  updateUserBindings: async (
    userId: number,
    version: number,
    bindings: UserBinding[],
  ): Promise<UserBindingsResult> => {
    return nativeRequest<UserBindingsResult>(`/api/admin/users/${userId}/role-bindings`, {
      method: "PUT",
      body: JSON.stringify({ version, bindings }),
    });
  },

  /** 峰列表（组织口径，供个人中心与权限弹窗复用） */
  getAllPeaks: async (): Promise<Peak[]> => {
    const body = await nativeRequest<{ items?: Array<Record<string, unknown>> }>(
      "/api/organization/peaks?limit=100",
    );
    return (body.items ?? []).map((row) => ({
      id: String(row.id ?? ""),
      name: String(row.fantasyName ?? row.fantasy_name ?? row.name ?? ""),
      description: (row.description as string | undefined) ?? undefined,
    }));
  },
};
