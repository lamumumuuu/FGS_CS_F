// app/api/client/modules/event.ts

/**
 * 活动模块 API（统一后端原生 /api/events）。
 * 对外保持旧端 Event 视图模型（planned/ongoing/completed/cancelled）。
 */

import { nativeRequest } from "../core/native";

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
  participantCount?: number;
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

type Json = Record<string, unknown>;

function toLabelStatus(status: unknown): Event["status"] {
  switch (String(status ?? "")) {
    case "ongoing":
      return "ongoing";
    case "ended":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "planned";
  }
}

function transformEvent(raw: unknown): Event {
  const row = (raw ?? {}) as Json;
  const capacity = Number(row.capacity ?? 0);
  return {
    id: Number(row.id ?? 0),
    name: String(row.title ?? row.name ?? ""),
    description: (row.description as string | undefined) ?? undefined,
    location: (row.location as string | undefined) ?? undefined,
    startTime: (row.startsAt as string | undefined) ?? (row.starts_at as string | undefined),
    endTime: (row.endsAt as string | undefined) ?? (row.ends_at as string | undefined),
    organizerId: Number(row.organizerId ?? row.organizer_id ?? row.createdBy ?? row.created_by ?? 0),
    peakId: row.peakId != null ? Number(row.peakId) : null,
    type: String(row.visibility ?? "public") === "peak" ? "peak" : "global",
    status: toLabelStatus(row.status),
    maxParticipants: capacity > 0 ? capacity : undefined,
    participantCount: Number(row.registeredCount ?? row.registered_count ?? 0),
    createdAt: (row.createdAt as string | undefined) ?? undefined,
    updatedAt: (row.updatedAt as string | undefined) ?? undefined,
  };
}

function toNativePayload(data: CreateEventRequest): Json {
  return {
    title: data.name,
    description: data.description,
    location: data.location,
    startsAt: data.startTime || null,
    endsAt: data.endTime || null,
    capacity: data.maxParticipants ?? 0,
    visibility: data.type === "peak" ? "peak" : "public",
    peakId: data.type === "peak" ? data.peakId : null,
  };
}

async function listEvents(path: string): Promise<Event[]> {
  const body = await nativeRequest<{ items?: unknown[] }>(path);
  return (body.items ?? []).map(transformEvent);
}

export const eventApi = {
  getActive: () => listEvents("/api/events?limit=50"),

  getById: async (id: number) => transformEvent(await nativeRequest(`/api/events/${id}`)),

  create: async (data: CreateEventRequest) => {
    const created = await nativeRequest<Json>("/api/admin/events", {
      method: "POST",
      body: JSON.stringify(toNativePayload(data)),
    });
    return transformEvent(created);
  },

  update: async (id: number, data: CreateEventRequest) => {
    const current = await eventApi.getById(id);
    const statusNative = {
      planned: "upcoming",
      ongoing: "ongoing",
      completed: "ended",
      cancelled: "cancelled",
    }[current.status];
    const updated = await nativeRequest<Json>(`/api/admin/events/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...toNativePayload(data), status: statusNative }),
    });
    return transformEvent(updated);
  },

  delete: (id: number) =>
    nativeRequest<void>(`/api/admin/events/${id}`, { method: "DELETE" }),

  getMy: () => listEvents("/api/events/me/registered"),

  join: (id: number) =>
    nativeRequest<void>(`/api/events/${id}/register`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  end: (id: number) =>
    nativeRequest<void>(`/api/admin/events/${id}/close`, { method: "POST" }),
};
