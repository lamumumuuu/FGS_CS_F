// types/sect.ts

/** 宗门角色中文名 */
export type SectRole =
  | "宗主"
  | "大长老"
  | "太上长老"
  | "荣誉长老"
  | "长老"
  | "内门弟子"
  | "外门弟子";

/** 宗门各峰名称 */
export type SectPeak = string;

/** 弟子公开信息 */
export interface Disciple {
  id: string;
  name: string;
  studentId: string;
  role: SectRole;
  peak: SectPeak;
  avatar?: string;
  joinedAt: string;
  userId?: number;
  lingshi?: number;
}

/** 峰概要信息 */
export interface PeakInfo {
  id?: string;
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
  permissions: string[];
}

/**
 * 宗门管理级权限
 * 使用 module:action 格式（如 member:expel, peak:manage_members）
 * 具体权限常量定义见 types/permissions.ts
 */
export type SectPermission = string;

/** 右键菜单操作项配置 */
export interface ContextMenuItem {
  label: string;
  permission?: string;
  action: string;
  icon?: string;
}