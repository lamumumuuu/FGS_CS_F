// app/announcement/components/constants.ts

/**
 * 公告/活动页面共享的常量与工具函数
 *
 * 将原本内联在 page.tsx 中的 STATUS_MAP、时间格式化等公共逻辑抽取至此，
 * 供 AnnouncementCard、EventCard、EventDetailModal、EventModal 等组件复用。
 */

import type { Event } from "@/app/api/client/modules/event";

/** 活动状态 -> 标签与颜色的映射 */
export type StatusMap = Record<Event["status"], { label: string; color: string }>;

export const STATUS_MAP: StatusMap = {
  planned: { label: "进行中", color: "#059669" },     // planned 归类为进行中
  ongoing: { label: "进行中", color: "#059669" },
  completed: { label: "已结束活动", color: "#6b7280" },
  cancelled: { label: "已结束活动", color: "#6b7280" },  // cancelled 归类为已结束
};

// 返回当前时间的 YYYY-MM-DDTHH:00 格式字符串，作为 datetime-local 的默认值
export function getDefaultStartTime() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:00`;
}

// 返回当前时间的 YYYY-MM-DDTHH:00 格式字符串，作为 datetime-local 的 min 属性
export function getMinDateTime() {
  return getDefaultStartTime();
}

/** 将 ISO 日期字符串格式化为 YYYY-MM-DD HH:00 */
export function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:00`;
}
/**
 * 
 */