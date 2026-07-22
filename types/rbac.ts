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

/** 系统角色唯一标识 */
export type RoleName =
  | "sect_master"
  | "grand_elder"
  | "supreme_elder"
  | "honor_elder"
  | "elder"
  | "inner_disciple"
  | "outer_disciple";

/** 细粒度权限唯一标识 */
export type PermissionName =
  | "quest:view_all"
  | "quest:view_own_peak"
  | "quest:create_global"
  | "quest:create_peak"
  | "quest:create_draft"
  | "quest:edit_any"
  | "quest:edit_own_peak"
  | "quest:delete_any"
  | "quest:delete_own_peak"
  | "quest:accept"
  | "quest:submit"
  | "quest:review"
  | "quest:force_close"
  | "member:view_all"
  | "member:view_own_peak"
  | "member:approve_join"
  | "member:update_role"
  | "member:appoint_elder"
  | "member:remove"
  | "affair:announce_global"
  | "affair:announce_peak"
  | "affair:event_create"
  | "affair:event_manage"
  | "peak:create"
  | "peak:edit_any"
  | "peak:edit_own"
  | "peak:add_member"
  | "finance:view_all"
  | "finance:view_own_peak"
  | "finance:adjust"
  | "finance:set_base"
  | "system:admin";

/** 用户完整权限聚合 */
export interface UserPermissions {
  permissions: Permission[];
  permissionNames: string[];
  roles: Role[];
  roleNames: string[];
  peakIds: number[];
  isGlobal: boolean;
}