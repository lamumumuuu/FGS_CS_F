// app/api/client/modules/announcement.ts

/**
 * 公告 API 模块（统一后端原生 /api/announcements）。
 * 对外保持旧端 Announcement 视图模型（global/peak）。
 */

import { nativeRequest } from "../core/native";

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

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  type: "global" | "peak";
  peakId?: number;
}

type Json = Record<string, unknown>;

function transformAnnouncement(raw: unknown): Announcement {
  const row = (raw ?? {}) as Json;
  return {
    id: Number(row.id ?? 0),
    title: String(row.title ?? ""),
    content: String(row.content ?? ""),
    publisherId: Number(row.createdBy ?? row.created_by ?? 0),
    peakId: row.peakId != null ? Number(row.peakId) : null,
    type: String(row.visibility ?? "public") === "peak" ? "peak" : "global",
    status: String(row.status ?? ""),
    createdAt: (row.createdAt as string | undefined) ?? undefined,
    updatedAt: (row.updatedAt as string | undefined) ?? undefined,
  };
}

function toNativePayload(data: CreateAnnouncementRequest): Json {
  return {
    title: data.title,
    content: data.content,
    visibility: data.type === "peak" ? "peak" : "public",
    peakId: data.type === "peak" ? data.peakId : null,
    status: "published",
    isActive: true,
  };
}

export const announcementApi = {
  /** 公开生效公告 */
  getPublished: async () => {
    const rows = await nativeRequest<unknown[]>("/api/announcements");
    return rows.map(transformAnnouncement);
  },

  /** 公告详情（管理视图） */
  getById: async (id: number) =>
    transformAnnouncement(await nativeRequest(`/api/announcements/admin/${id}`)),

  /** 创建并发布公告 */
  create: async (data: CreateAnnouncementRequest) =>
    transformAnnouncement(
      await nativeRequest<Json>("/api/announcements/admin", {
        method: "POST",
        body: JSON.stringify(toNativePayload(data)),
      }),
    ),

  /** 更新公告 */
  update: async (id: number, data: CreateAnnouncementRequest) =>
    transformAnnouncement(
      await nativeRequest<Json>(`/api/announcements/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify(toNativePayload(data)),
      }),
    ),

  delete: (id: number) =>
    nativeRequest<void>(`/api/announcements/admin/${id}`, { method: "DELETE" }),

  /** 管理视图全部公告（旧端“我发布的”在页面上按 publisher 过滤） */
  getMy: async () => {
    const rows = await nativeRequest<unknown[]>("/api/announcements/admin");
    return rows.map(transformAnnouncement);
  },

  publish: async (id: number) =>
    transformAnnouncement(
      await nativeRequest<Json>(`/api/announcements/admin/${id}/publish`, { method: "POST" }),
    ),

  archive: async (id: number) =>
    transformAnnouncement(
      await nativeRequest<Json>(`/api/announcements/admin/${id}/archive`, { method: "POST" }),
    ),
};
