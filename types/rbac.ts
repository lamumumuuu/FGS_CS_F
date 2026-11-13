// types/rbac.ts

/** 权限记录 */
export interface Permission {
  id: string;
  name: string;
  displayName: string;
  module: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
}

/** 角色记录 */
export interface Role {
  id: string;
  name: string;
  displayName: string;
  /** 原始展示名（不含宗门展示名覆盖，供角色维护回填） */
  baseDisplayName?: string;
  /** 宗门展示名（与 displayName 同角色、不同视觉名称） */
  fantasyDisplayName?: string;
  description?: string;
  level: number;
  isSystem: number;
  /** 保护角色（不可删除/不可改名） */
  isProtected?: boolean;
  /** 绑定该角色的用户数 */
  userCount?: number;
  createTime?: string;
  updateTime?: string;
}

/** 峰（组织单元） */
export interface Peak {
  id: string;
  name: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
}

/** 用户完整权限聚合 */
export interface UserPermissions {
  permissions: Permission[];
  permissionNames: string[];
  roles: Role[];
  roleNames: string[];
  peakIds: number[];
  isGlobal: boolean;
}