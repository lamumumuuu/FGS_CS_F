// app/api/client/modules/task.ts

/**
 * 任务大厅 API 模块
 * 
 * 提供任务列表、任务详情、任务发布、任务审核等相关接口。
 * 包含后端数据格式到前端格式的转换逻辑。
 */

import { Task, TaskFilters, CreateTaskRequest } from "@/types/task";
import { request } from "../core/request";

/**
 * 将后端返回的任务数据转换为前端 Task 格式
 * 
 * @param backendTask - 后端返回的任务数据
 * @returns 前端 Task 对象
 */
function transformTaskFromBackend(backendTask: any): Task {
  const task = backendTask as any;
  const publisherName = task.publisherName || task.publisher_name || (task.publisher ? task.publisher.name : "未知");
  const publisherAvatar = task.publisherAvatar || task.publisher_avatar || (task.publisher ? task.publisher.avatar : "");
  const completerName = task.completerName || task.completer_name || (task.completer ? task.completer.name : undefined);
  const completerAvatar = task.completerAvatar || task.completer_avatar || (task.completer ? task.completer.avatar : undefined);

  let techRequirements: string[] = [];
  if (task.techRequirements) {
    if (Array.isArray(task.techRequirements)) {
      techRequirements = task.techRequirements;
    } else if (typeof task.techRequirements === "string") {
      techRequirements = task.techRequirements.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  } else if (task.tech_requirements) {
    if (typeof task.tech_requirements === "string") {
      techRequirements = task.tech_requirements.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }

  const result: Task = {
    id: String(task.id),
    title: task.title,
    description: task.description,
    difficulty: task.difficulty as any,
    status: task.status as any,
    reward: Number(task.reward) || 0,
    deadline: task.deadline ? new Date(task.deadline).toLocaleDateString() : "无期限",
    publisher: {
      id: String(task.publisherId || task.publisher_id || (task.publisher ? task.publisher.id : "")),
      name: publisherName,
      avatar: publisherAvatar,
    },
    createdAt: task.createdAt || task.created_at ? new Date(task.createdAt || task.created_at).toLocaleString() : "",
    techRequirements,
    rejectReason: task.rejectReason || task.reject_reason,
    reviewedBy: task.reviewedBy || task.reviewed_by,
    reviewedAt: task.reviewedAt || task.reviewed_at,
    peakId: task.peakId || task.peak_id,
    publisherId: task.publisherId || task.publisher_id,
    publisherName,
    publisherAvatar,
    // 提交成果相关字段（勇者提交悬赏时填写）
    submissionDescription: task.submissionDescription || task.submission_description || undefined,
    attachmentUrl: task.attachmentUrl || task.attachment_url || undefined,
  };

  if (completerName) {
    result.completer = {
      id: String(task.completerId || task.completer_id || ""),
      name: completerName,
      avatar: completerAvatar || "",
    };
  }

  return result;
}

/**
 * 批量转换任务列表
 * 
 * @param tasks - 后端任务列表
 * @returns 前端 Task 对象列表
 */
function transformTaskList(tasks: any[]): Task[] {
  if (!tasks || !Array.isArray(tasks)) return [];
  return tasks.map(transformTaskFromBackend);
}

export const taskApi = {
  /**
   * 获取任务列表（需认证）
   * 
   * @param filters - 筛选条件（难度、状态、关键词）
   * @returns 任务列表
   * @throws Error - 用户未登录时抛出
   * 
   * 使用场景：任务大厅页面展示任务列表，支持按难度、状态筛选和关键词搜索。
   * 业务逻辑：非"全部"选项才会添加到查询参数中。
   */
  getTasks: async (filters?: Partial<TaskFilters>) => {
    const params = new URLSearchParams();
    if (filters?.difficulty && filters.difficulty !== "全部难度") params.set("difficulty", filters.difficulty);
    if (filters?.status && filters.status !== "全部状态") params.set("status", filters.status);
    if (filters?.keyword) params.set("keyword", filters.keyword);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await request<any[]>(`/tasks${query}`, undefined, true);
    return transformTaskList(data);
  },

  /**
   * 获取任务详情（需认证）
   * 
   * @param id - 任务 ID
   * @returns 任务详情
   * @throws Error - 用户未登录或任务不存在时抛出
   * 
   * 使用场景：任务详情页面展示任务的完整信息。
   */
  getTaskById: async (id: string) => {
    const data = await request<any>(`/tasks/${id}`, undefined, true);
    return transformTaskFromBackend(data);
  },

  /**
   * 创建任务（发布悬赏）（需认证）
   * 
   * @param data - 任务创建请求数据
   * @returns 创建成功的任务对象
   * @throws Error - 用户未登录、权限不足或参数错误时抛出
   * 
   * 使用场景：用户在任务发布页面提交新任务时调用。
   */
  createTask: async (data: CreateTaskRequest) => {
    const result = await request<any>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }, true);
    return transformTaskFromBackend(result);
  },

  /**
   * 获取待审核任务列表（需认证）
   * 
   * @returns 待审核任务列表
   * @throws Error - 用户未登录或无审核权限时抛出
   * 
   * 使用场景：任务审核页面展示所有待审核的任务。
   */
  getPendingTasks: async () => {
    const data = await request<any[]>("/tasks/pending", undefined, true);
    return transformTaskList(data);
  },

  /**
   * 审核通过任务（需认证）
   * 
   * @param id - 任务 ID
   * @returns 审核后的任务对象
   * @throws Error - 用户未登录、无审核权限或任务不存在时抛出
   * 
   * 使用场景：管理员在任务审核页面点击"通过"按钮时调用。
   * 业务逻辑：审核通过后任务状态变更，自动进入任务大厅。
   */
  approveTask: async (id: string) => {
    const data = await request<any>(`/tasks/${id}/approve`, {
      method: "POST",
    }, true);
    return transformTaskFromBackend(data);
  },

  /**
   * 审核拒绝任务（需认证）
   * 
   * @param id - 任务 ID
   * @param reason - 拒绝原因（可选）
   * @returns 审核后的任务对象
   * @throws Error - 用户未登录、无审核权限或任务不存在时抛出
   * 
   * 使用场景：管理员在任务审核页面点击"拒绝"按钮时调用。
   * 业务逻辑：拒绝时可附带拒绝原因，供发布者查看。
   */
  rejectTask: async (id: string, reason?: string) => {
    const data = await request<any>(`/tasks/${id}/reject`, {
      method: "POST",
      body: reason ? JSON.stringify({ reason }) : undefined,
    }, true);
    return transformTaskFromBackend(data);
  },

  /**
   * 获取我发布的任务（需认证）
   * 
   * @returns 当前用户发布的任务列表
   * @throws Error - 用户未登录时抛出
   * 
   * 使用场景：个人中心"我发布的悬赏"页面展示用户发布的所有任务。
   */
  getMyTasks: async () => {
    const data = await request<any[]>("/tasks/my", undefined, true);
    return transformTaskList(data);
  },

  /**
   * 获取我完成的任务（需认证）
   * 
   * @returns 当前用户完成的任务列表
   * @throws Error - 用户未登录时抛出
   * 
   * 使用场景：个人中心"我的征途"页面展示用户成功完成的所有任务。
   */
  getMyCompletedTasks: async () => {
    const data = await request<any[]>("/tasks/completed", undefined, true);
    return transformTaskList(data);
  },

  /**
   * 接受任务（需认证）
   * 
   * @param id - 任务 ID
   * @returns 更新后的任务对象
   * @throws Error - 用户未登录、权限不足或任务状态错误时抛出
   * 
   * 使用场景：任务详情页面点击"接受委托"按钮时调用。
   */
  acceptTask: async (id: string) => {
    const data = await request<any>(`/tasks/${id}/accept`, {
      method: "POST",
    }, true);
    return transformTaskFromBackend(data);
  },

  /**
   * 提交任务成果（需认证）
   * 
   * @param id - 任务 ID
   * @param description - 提交描述
   * @param attachmentUrl - 附件链接（可选）
   * @returns 更新后的任务对象
   * @throws Error - 用户未登录、权限不足或任务状态错误时抛出
   * 
   * 使用场景：任务详情页面点击"提交悬赏"按钮时调用。
   */
  submitTask: async (id: string, description: string, attachmentUrl?: string) => {
    const data = await request<any>(`/tasks/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ description, attachmentUrl }),
    }, true);
    return transformTaskFromBackend(data);
  },

  /**
   * 完成任务（需认证）
   * 
   * @param id - 任务 ID
   * @returns 更新后的任务对象
   * @throws Error - 用户未登录、权限不足或任务状态错误时抛出
   * 
   * 使用场景：任务详情页面点击"完成任务"按钮时调用（审核者确认任务完成）。
   */
  completeTask: async (id: string) => {
    const data = await request<any>(`/tasks/${id}/complete`, {
      method: "POST",
    }, true);
    return transformTaskFromBackend(data);
  },

  /**
   * 获取我接取的任务（需认证）
   * 
   * @returns 当前用户接取的所有任务列表
   * @throws Error - 用户未登录时抛出
   * 
   * 使用场景：个人中心"我接取的任务"页面展示用户接取的所有任务。
   */
  getMyAcceptedTasks: async () => {
    const data = await request<any[]>("/tasks/accepted", undefined, true);
    return transformTaskList(data);
  },

  /**
   * 编辑任务（需认证，需 quest:edit_any 或 quest:edit_own_peak 权限）
   * 
   * @param id - 任务 ID
   * @param data - 任务更新数据
   * @returns 更新后的任务对象
   * @throws Error - 用户未登录、权限不足或任务不存在时抛出
   * 
   * 使用场景：管理员或发布者在任务详情页面点击"编辑任务"时调用。
   */
  updateTask: async (id: string, data: Partial<CreateTaskRequest>) => {
    const result = await request<any>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }, true);
    return transformTaskFromBackend(result);
  },

  /**
   * 删除任务（需认证，需 quest:delete_any 或 quest:delete_own_peak 权限）
   * 
   * @param id - 任务 ID
   * @returns 删除结果
   * @throws Error - 用户未登录、权限不足或任务不存在时抛出
   * 
   * 使用场景：管理员或发布者在任务详情页面点击"删除任务"时调用。
   */
  deleteTask: async (id: string) => {
    await request<void>(`/tasks/${id}`, {
      method: "DELETE",
    }, true);
  },

  /**
   * 强制结项（需认证，需 quest:force_close 权限）
   * 
   * @param id - 任务 ID
   * @param reason - 强制结项原因（可选）
   * @returns 更新后的任务对象
   * @throws Error - 用户未登录、权限不足或任务状态错误时抛出
   * 
   * 使用场景：管理员在任务管理页面强制终止违规任务时调用。
   */
  forceCloseTask: async (id: string, reason?: string) => {
    const data = await request<any>(`/tasks/${id}/force-close`, {
      method: "POST",
      body: reason ? JSON.stringify({ reason }) : undefined,
    }, true);
    return transformTaskFromBackend(data);
  },
};