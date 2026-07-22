// types/sect.ts

/** 宗门角色中文名 */
export type SectRole =
  | "宗主"
  | "大长老"
  | "太上长老"
  | "荣誉长老"
  | "长老"
  | "弟子";

/** 宗门各峰名称 */
export type SectPeak = "项目峰" | "算法峰" | "电路峰" | "管理台";

/** 弟子公开信息 */
export interface Disciple {
  id: string;
  name: string;
  studentId: string;
  role: SectRole;
  peak: SectPeak;
  avatar?: string;
  joinedAt: string;
}

/** 峰概要信息 */
export interface PeakInfo {
  name: SectPeak;
  description: string;
  leaderId?: string;
  memberCount: number;
}

/** 当前用户宗门业务简况 */
export interface CurrentUser {
  id: string;
  name: string;
  role: SectRole;
  peak: SectPeak;
  permissions: SectPermission[];
}

/** 宗门管理级权限 */
export type SectPermission =
  | "manage_permissions"
  | "move_disciple"
  | "reward_disciple"
  | "delete_disciple"
  | "add_disciple"
  | "manage_peaks";

/** 右键菜单操作项配置 */
export interface ContextMenuItem {
  label: string;
  permission?: SectPermission;
  action: string;
  icon?: string;
}