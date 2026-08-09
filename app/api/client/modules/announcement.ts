// app/api/client/modules/announcement.ts

/**
 * 公告 API 模块
 *
 * 提供公告的 CRUD 接口。
 * 方法命名与 eventApi 保持一致（getPublished / create / update / delete / getMy）。
 *
 * 后端端点（AnnouncementController，前缀 /api/announcements）：
 * - GET    /              获取已发布公告列表（需权限 affair:view）
 * - GET    /{id}          获取公告详情（需权限 affair:view）
 * - POST   /              创建公告（需权限 affair:announce_peak）
 * - PUT    /{id}          更新公告（需权限 affair:manage_own_peak）
 * - DELETE /{id}          删除公告（需权限 affair:manage_own_peak）
 * - GET    /my            获取当前用户发布的公告（需权限 affair:view）
 */

import { request } from "../core/request";

/** 公告实体（与后端 Announcement 实体 + 服务层补充字段对齐） */
export interface Announcement {
  id: number;
  title: string;
  content: string;
  publisherId: number;
  publisherName?: string;
  peakId?: number | null;
  type: "global" | "peak";
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 创建公告请求体（与后端 CreateAnnouncementDTO 对齐） */
export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  type: "global" | "peak";
  peakId?: number;
}

export const announcementApi = {
  /**
   * 获取已发布公告列表（需认证，权限：affair:view）
   */
  getPublished: async () => {
    return await request<Announcement[]>("/announcements", undefined, true);
  },

  /**
   * 获取公告详情（需认证，权限：affair:view）
   */
  getById: async (id: number) => {
    return await request<Announcement>(`/announcements/${id}`, undefined, true);
  },

  /**
   * 创建公告（需权限：affair:announce_global 或 affair:announce_peak）
   */
  create: async (data: CreateAnnouncementRequest) => {
    return await request<Announcement>("/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * 更新公告（需权限：affair:manage_own_peak）
   */
  update: async (id: number, data: CreateAnnouncementRequest) => {
    return await request<Announcement>(`/announcements/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * 删除公告（需权限：affair:manage_own_peak）
   */
  delete: async (id: number) => {
    return await request<void>(`/announcements/${id}`, {
      method: "DELETE",
    }, true);
  },

  /**
   * 获取当前用户发布的公告（需认证，权限：affair:view）
   */
  getMy: async () => {
    return await request<Announcement[]>("/announcements/my", undefined, true);
  },
};
