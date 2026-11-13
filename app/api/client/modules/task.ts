// app/api/client/modules/task.ts

/**
 * 任务大厅 API 模块（统一后端原生 /api/tasks）
 *
 * 浏览器只访问本站同源 BFF（HttpOnly Cookie），不再读取 localStorage token，
 * 也不再拼接 Java 8081 地址。对外仍返回旧端 Task 视图模型（中文状态）。
 */

import { Task, TaskFilters, CreateTaskRequest } from "@/types/task";
import { nativeRequest } from "../core/native";

type Json = Record<string, unknown>;

const NATIVE_TO_LABEL: Record<string, string> = {
  draft: "审核中",
  pending_review: "审核中",
  rejected: "已驳回",
  published: "等待中",
  in_progress: "讨伐中",
  submitted: "已提交",
  completed: "已完成",
  closed: "已结束",
  expired: "已过期",
};

const LABEL_TO_NATIVE: Record<string, string> = {
  审核中: "pending_review",
  等待中: "published",
  讨伐中: "in_progress",
  已提交: "submitted",
  已完成: "completed",
  已驳回: "rejected",
};

function toLabelStatus(status: unknown): string {
  return NATIVE_TO_LABEL[String(status ?? "")] ?? String(status ?? "");
}

function transformTaskFromBackend(backendTask: unknown): Task {
  const task = (backendTask ?? {}) as Json;
  const tags = Array.isArray(task.tags) ? (task.tags as string[]) : [];
  const reward = Number(task.rewardTotal ?? task.reward_total ?? task.reward ?? 0);
  const deadlineRaw = (task.deadline as string | null) ?? null;
  const publisherName = String(task.publisherName ?? task.publisher_name ?? "未知");
  const result: Task = {
    id: String(task.id ?? ""),
    title: String(task.title ?? ""),
    description: String(task.description ?? ""),
    difficulty: (task.difficulty as Task["difficulty"]) ?? "黑铁",
    status: toLabelStatus(task.status) as Task["status"],
    reward,
    deadline: deadlineRaw ? new Date(deadlineRaw).toLocaleDateString() : "无期限",
    publisher: {
      id: String(task.publisherId ?? task.publisher_id ?? ""),
      name: publisherName,
      avatar: "",
    },
    createdAt: task.createdAt || task.created_at
      ? new Date(String(task.createdAt ?? task.created_at)).toLocaleString()
      : "",
    techRequirements: tags,
    rejectReason: (task.rejectReason as string | undefined) ?? undefined,
    reviewedBy: task.reviewedBy != null ? String(task.reviewedBy) : undefined,
    reviewedAt: (task.reviewedAt as string | undefined) ?? undefined,
    peakId: task.peakId != null ? Number(task.peakId) : undefined,
    publisherId: task.publisherId != null ? Number(task.publisherId) : undefined,
    publisherName,
    publisherAvatar: "",
    version: Number(task.version ?? 1),
  };

  const activeClaim = (task.activeClaim ?? task.active_claim ?? null) as Json | null;
  if (activeClaim) {
    const members = Array.isArray(activeClaim.members) ? (activeClaim.members as Json[]) : [];
    const leader = members.find((member) => Boolean(member.isLeader ?? member.is_leader));
    result.completer = {
      id: String(activeClaim.leaderUserId ?? activeClaim.leader_user_id ?? ""),
      name: String(leader?.displayName ?? leader?.display_name ?? ""),
      avatar: "",
    };
  }
  return result;
}

function transformTaskList(tasks: unknown): Task[] {
  if (!Array.isArray(tasks)) return [];
  return (tasks as unknown[]).map(transformTaskFromBackend);
}

async function listTasks(query: string): Promise<Task[]> {
  const body = await nativeRequest<{ items?: unknown[] }>(`/api/tasks${query}`);
  return transformTaskList(body.items ?? []);
}

async function getTaskById(id: string): Promise<Task> {
  return transformTaskFromBackend(await nativeRequest<Json>(`/api/tasks/${id}`));
}

async function myClaims(): Promise<Json[]> {
  const body = await nativeRequest<{ items?: Json[] }>("/api/tasks/me/claims?limit=50");
  return body.items ?? [];
}

function claimTask(claim: Json): Task | null {
  const task = claim.task;
  if (!task || typeof task !== "object") return null;
  const mapped = transformTaskFromBackend(task);
  const submission = (claim.submission ?? null) as Json | null;
  if (submission) {
    mapped.submissionDescription = (submission.description as string | undefined) ?? undefined;
    const attachments = Array.isArray(submission.attachments) ? (submission.attachments as string[]) : [];
    mapped.attachmentUrl = attachments.length ? attachments[0] : undefined;
    if (String(submission.reviewStatus ?? "") === "rejected") {
      mapped.rejectReason = (submission.reviewNote as string | undefined) ?? undefined;
    }
  }
  return mapped;
}

function toIsoOrNull(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function detailAfterAction(id: string): Promise<Task> {
  return getTaskById(id);
}

export const taskApi = {
  /** 任务大厅：默认 published；状态/关键词走服务端，难度在客户端过滤 */
  getTasks: async (filters?: Partial<TaskFilters>) => {
    const params = new URLSearchParams({ limit: "50" });
    const nativeStatus = filters?.status ? LABEL_TO_NATIVE[filters.status] : undefined;
    if (nativeStatus) params.set("status", nativeStatus);
    if (filters?.keyword) params.set("keyword", filters.keyword);
    const all = await listTasks(`?${params.toString()}`);
    if (filters?.difficulty && filters.difficulty !== "全部难度") {
      return all.filter((task) => task.difficulty === filters.difficulty);
    }
    return all;
  },

  getTaskById,

  /** 创建任务：先建草稿，再申请上架 */
  createTask: async (data: CreateTaskRequest) => {
    const deadline = toIsoOrNull(data.deadline) ?? new Date(Date.now() + 7 * 864e5).toISOString();
    const created = await nativeRequest<Json>("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        rewardTotal: String(data.reward),
        executionMode: "single",
        maxMembers: 1,
        deadline,
        visibility: data.peakId ? "peak" : "members",
        peakId: data.peakId,
        tags: (data.techRequirements ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });
    await nativeRequest(`/api/tasks/${String(created.id)}/review-requests`, { method: "POST" });
    return transformTaskFromBackend(created);
  },

  /** 待审核列表 */
  getPendingTasks: async () => {
    const body = await nativeRequest<{ items?: unknown[] }>(
      "/api/admin/tasks?status=pending_review&limit=50",
    );
    return transformTaskList(body.items ?? []);
  },

  approveTask: async (id: string) => {
    await nativeRequest(`/api/admin/tasks/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify({ decision: "approve" }),
    });
    return detailAfterAction(id);
  },

  rejectTask: async (id: string, reason?: string) => {
    await nativeRequest(`/api/admin/tasks/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify({ decision: "reject", note: reason ?? "未填写原因" }),
    });
    return detailAfterAction(id);
  },

  getMyTasks: async () => {
    const body = await nativeRequest<{ items?: unknown[] }>("/api/tasks/me/published?limit=50");
    return transformTaskList(body.items ?? []);
  },

  /** 我完成的任务（claim status=completed） */
  getMyCompletedTasks: async () => {
    const claims = await myClaims();
    return claims
      .filter((claim) => String(claim.status ?? "") === "completed")
      .map(claimTask)
      .filter((task): task is Task => task !== null);
  },

  /** 接取任务：单人任务；团队入口后续由页面传 teamId */
  acceptTask: async (id: string) => {
    await nativeRequest(`/api/tasks/${id}/claims`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return detailAfterAction(id);
  },

  /** 提交成果：按任务 ID 找到当前执行实例后提交 */
  submitTask: async (id: string, description: string, attachmentUrl?: string) => {
    const claims = await myClaims();
    const claim = claims.find(
      (item) =>
        String(item.taskId ?? item.task_id ?? "") === String(id) &&
        ["active", "submitted"].includes(String(item.status ?? "")),
    );
    if (!claim) throw new Error("未找到当前任务执行记录");
    await nativeRequest(`/api/task-claims/${String(claim.id)}/submissions`, {
      method: "POST",
      body: JSON.stringify({
        description,
        attachments: attachmentUrl ? [attachmentUrl] : [],
      }),
    });
    return detailAfterAction(id);
  },

  /** 管理员验收成果：找到待审成果后通过 */
  completeTask: async (id: string) => {
    const claims = await nativeRequest<Json[]>(`/api/tasks/${id}/claims`);
    const pending = claims.find((claim) => {
      const submission = claim.submission as Json | null;
      return submission && String(submission.reviewStatus ?? "") === "pending";
    });
    if (!pending) throw new Error("未找到待验收成果");
    const submission = pending.submission as Json;
    await nativeRequest(`/api/admin/task-submissions/${String(submission.id)}/reviews`, {
      method: "POST",
      body: JSON.stringify({ decision: "approve" }),
    });
    return detailAfterAction(id);
  },

  getMyAcceptedTasks: async () => {
    const claims = await myClaims();
    return claims
      .filter((claim) => ["active", "submitted"].includes(String(claim.status ?? "")))
      .map(claimTask)
      .filter((task): task is Task => task !== null);
  },

  /** 编辑任务：仅草稿/驳回可改全部字段；已发布仅展示字段 */
  updateTask: async (id: string, data: Partial<CreateTaskRequest>) => {
    const current = await getTaskById(id);
    const body: Json = {};
    if (data.title !== undefined) body.title = data.title;
    if (data.description !== undefined) body.description = data.description;
    if (data.difficulty !== undefined) body.difficulty = data.difficulty;
    if (data.reward !== undefined) body.rewardTotal = String(data.reward);
    if (data.deadline !== undefined) body.deadline = toIsoOrNull(data.deadline);
    if (data.techRequirements !== undefined) {
      body.tags = data.techRequirements
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    await nativeRequest(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "If-Match": String(current.version ?? 1) },
      body: JSON.stringify(body),
    });
    return detailAfterAction(id);
  },

  deleteTask: async (id: string) => {
    const current = await getTaskById(id);
    await nativeRequest(`/api/tasks/${id}`, {
      method: "DELETE",
      headers: { "If-Match": String(current.version ?? 1) },
    });
  },

  forceCloseTask: async (id: string, reason?: string) => {
    await nativeRequest(`/api/admin/tasks/${id}/force-close`, {
      method: "POST",
      body: JSON.stringify({ reason: reason?.trim() || "管理员强制结项" }),
    });
    return detailAfterAction(id);
  },
};
