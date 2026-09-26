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
  description?: string;
  level: number;
  isSystem: number;
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