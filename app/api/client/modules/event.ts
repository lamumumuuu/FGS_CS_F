// app/api/client/modules/event.ts

/**
 * 活动模块 API
 * 提供活动的 CRUD 接口
 */

import { request } from "../core/request";

export interface Event {
  id: number;
  name: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  organizerId: number;
  organizerName?: string;
  peakId?: number | null;
  type: "global" | "peak";
  status: "planned" | "ongoing" | "completed" | "cancelled";
  maxParticipants?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  peakId?: number;
  type?: "global" | "peak";
  maxParticipants?: number;
}

export const eventApi = {
  /** 获取活动列表 */
  getActive: () =>
    request<Event[]>("/events", undefined, true),

  /** 获取活动详情 */
  getById: (id: number) =>
    request<Event>(`/events/${id}`, undefined, true),

  /** 创建活动 */
  create: (data: CreateEventRequest) =>
    request<Event>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }, true),

  /** 更新活动 */
  update: (id: number, data: CreateEventRequest) =>
    request<Event>(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }, true),

  /** 删除活动 */
  delete: (id: number) =>
    request<void>(`/events/${id}`, {
      method: "DELETE",
    }, true),

  /** 获取我的活动 */
  getMy: () =>
    request<Event[]>("/events/my", undefined, true),
};
