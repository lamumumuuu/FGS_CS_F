export type SectRole =
  | "宗主"
  | "大长老"
  | "太上长老"
  | "荣誉长老"
  | "长老"
  | "弟子";

export type SectPeak = "项目峰" | "算法峰" | "电路峰" | "管理台";

export interface Disciple {
  id: string;
  name: string;
  studentId: string;
  role: SectRole;
  peak: SectPeak;
  avatar?: string;
  joinedAt: string;
}

export interface PeakInfo {
  name: SectPeak;
  description: string;
  leaderId?: string;
  memberCount: number;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: SectRole;
  peak: SectPeak;
  permissions: Permission[];
}

export type Permission =
  | "manage_permissions"
  | "move_disciple"
  | "reward_disciple"
  | "delete_disciple"
  | "add_disciple"
  | "manage_peaks";

export interface ContextMenuItem {
  label: string;
  permission?: Permission;
  action: string;
  icon?: string;
}
