// app/api/client/modules/sect.ts

/**
 * 宗门事务 API 模块
 *
 * 提供弟子管理、峰信息查询等宗门相关接口。
 * 包含后端角色字段与前端中文显示的转换逻辑。
 */

import { Disciple, PeakInfo, CurrentUser, SectPeak } from "@/types/sect";
import { request } from "../core/request";

/**
 * 后端英文字段 → 前端中文显示（角色）
 */
const ROLE_EN_TO_CN: Record<string, string> = {
  "sect_master": "宗主",
  "grand_elder": "大长老",
  "supreme_elder": "太上长老",
  "honor_elder": "荣誉长老",
  "elder": "长老",
  "inner_disciple": "内门弟子",
  "outer_disciple": "外门弟子",
};

/**
 * 前端中文显示 → 后端英文字段（角色）
 */
const ROLE_CN_TO_EN: Record<string, string> = {
  "宗主": "sect_master",
  "大长老": "grand_elder",
  "太上长老": "supreme_elder",
  "荣誉长老": "honor_elder",
  "长老": "elder",
  "内门弟子": "inner_disciple",
  "外门弟子": "outer_disciple",
};

/**
 * 将后端弟子数据转换为前端 Disciple 格式
 * 
 * @param backendDisciple - 后端返回的弟子数据
 * @returns 前端 Disciple 对象
 */
function transformDiscipleFromBackend(backendDisciple: any): Disciple {
  const d = backendDisciple as any;
  const role = ROLE_EN_TO_CN[d.role] || d.role || "弟子";
  const peak = d.peak || "无";

  return {
    id: String(d.id),
    name: d.name,
    studentId: d.studentId || d.student_id || "",
    role: role as any,
    peak: peak as any,
    avatar: d.avatar,
    joinedAt: d.joinedAt || d.joined_at ? new Date(d.joinedAt || d.joined_at).toLocaleDateString() : "",
    userId: d.userId || d.user_id,
    lingshi: d.lingshi || 0,
  };
}

/**
 * 批量转换弟子列表
 * 
 * @param disciples - 后端弟子列表
 * @returns 前端 Disciple 对象列表
 */
function transformDiscipleList(disciples: any[]): Disciple[] {
  if (!disciples || !Array.isArray(disciples)) return [];
  return disciples.map(transformDiscipleFromBackend);
}

/**
 * 将前端 Disciple 对象中的中文角色还原为后端英文字段，用于提交更新
 * 
 * @param disciple - 前端 Disciple 对象（部分字段）
 * @returns 适合发送给后端的对象
 */
function transformDiscipleForUpdate(disciple: Partial<Disciple>): Record<string, any> {
  const body: Record<string, any> = { ...disciple };
  if (body.role && ROLE_CN_TO_EN[body.role as string]) {
    body.role = ROLE_CN_TO_EN[body.role as string];
  }
  return body;
}

export const sectApi = {
  /**
   * 获取当前用户的宗门信息（需认证）
   * 
   * @returns 当前用户的宗门信息
   * @throws Error - 用户未登录时抛出
   * 
   * 使用场景：个人中心或首页展示用户的宗门身份信息。
   */
  getCurrentUser: async () => {
    const data = await request<any>("/sect/current-user", undefined, true);
    return data as CurrentUser;
  },

  /**
   * 获取所有弟子列表（需认证）
   * 
   * @returns 所有弟子列表
   * @throws Error - 用户未登录时抛出
   * 
   * 使用场景：宗门事务页面展示所有弟子信息。
   */
  getAllDisciples: async () => {
    const data = await request<any[]>("/sect/disciples", undefined, true);
    return transformDiscipleList(data);
  },

  /**
   * 获取管理团队弟子列表（需认证）
   * 
   * @returns 管理层弟子列表
   * @throws Error - 用户未登录时抛出
   * 
   * 使用场景：宗门事务页面展示宗门管理人员信息。
   */
  getManagementDisciples: async () => {
    const data = await request<any[]>("/sect/disciples/management", undefined, true);
    return transformDiscipleList(data);
  },

  /**
   * 按峰获取弟子列表（需认证）
   * 
   * @param peak - 峰名称
   * @returns 指定峰的弟子列表
   * @throws Error - 用户未登录时抛出
   * 
   * 使用场景：按峰筛选弟子时调用。
   */
  getDisciplesByPeak: async (peak: SectPeak) => {
    const data = await request<any[]>(`/sect/disciples?peak=${encodeURIComponent(peak)}`, undefined, true);
    return transformDiscipleList(data);
  },

  /**
   * 获取所有峰信息（需认证）
   * 
   * @returns 所有峰的信息列表
   * @throws Error - 用户未登录时抛出
   * 
   * 使用场景：宗门事务页面展示各峰信息，或弟子分配时选择峰。
   */
  getAllPeaks: async () => {
    const data = await request<any[]>("/sect/peaks", undefined, true);
    // 过滤掉 _TREASURY_ 特殊峰（财务模块的持久化容器，不应在宗门事务中显示）
    return data
      .filter((p: any) => p.name !== "_TREASURY_")
      .map((p: any) => ({
        id: String(p.id || ""),
        name: p.name,
        description: p.description || "",
        memberCount: p.memberCount || p.member_count || 0,
      })) as PeakInfo[];
  },

  /**
   * 搜索弟子（需认证）
   * 
   * @param keyword - 搜索关键词
   * @returns 匹配的弟子列表
   * @throws Error - 用户未登录时抛出
   * 
   * 使用场景：宗门事务页面的搜索功能，按关键词查找弟子。
   */
  searchDisciples: async (keyword: string) => {
    const data = await request<any[]>(`/sect/disciples/search?keyword=${encodeURIComponent(keyword)}`, undefined, true);
    return transformDiscipleList(data);
  },

  /**
   * 按峰筛选弟子（含"全部"）（需认证）
   * 
   * @param peak - 峰名称或"全部"
   * @returns 筛选后的弟子列表
   * @throws Error - 用户未登录时抛出
   * 
   * 使用场景：宗门事务页面按峰筛选弟子列表。
   */
  filterDisciplesByPeak: async (peak: SectPeak | "全部") => {
    const data = await request<any[]>(`/sect/disciples?peak=${encodeURIComponent(peak)}`, undefined, true);
    return transformDiscipleList(data);
  },

  /**
   * 更新弟子信息（包括角色）（需认证）
   * 
   * @param id - 弟子 ID
   * @param disciple - 弟子更新数据
   * @returns 更新后的弟子对象
   * @throws Error - 用户未登录、无权限或参数错误时抛出
   * 
   * 使用场景：管理员在宗门事务页面编辑弟子信息。
   * 业务逻辑：自动将中文角色名称转换为后端英文字段。
   */
  updateDisciple: async (id: string, disciple: Partial<Disciple>) => {
    const body = transformDiscipleForUpdate(disciple);
    const data = await request<any>(`/sect/disciples/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }, true);
    return transformDiscipleFromBackend(data);
  },

  /**
   * 移动弟子到另一峰（需认证）
   * 
   * @param discipleId - 弟子 ID
   * @param newPeak - 目标峰名称
   * @returns 移动是否成功
   * @throws Error - 用户未登录、无权限或参数错误时抛出
   * 
   * 使用场景：管理员在宗门事务页面调整弟子所属峰。
   */
  moveDisciplePeak: async (discipleId: string, newPeak: SectPeak) => {
    const data = await request<boolean>(`/sect/disciples/${discipleId}/move`, {
      method: "PUT",
      body: JSON.stringify({ peak: newPeak }),
    }, true);
    return data;
  },

  /**
   * 删除弟子（需认证）
   * 
   * @param discipleId - 弟子 ID
   * @returns 删除是否成功
   * @throws Error - 用户未登录、无权限或参数错误时抛出
   * 
   * 使用场景：管理员在宗门事务页面移除弟子。
   */
  deleteDisciple: async (discipleId: string) => {
    const data = await request<boolean>(`/sect/disciples/${discipleId}`, { method: "DELETE" }, true);
    return data;
  },

  /**
   * 添加新弟子（需认证）
   * 
   * @param disciple - 新弟子信息
   * @returns 添加成功的弟子对象
   * @throws Error - 用户未登录、无权限或参数错误时抛出
   * 
   * 使用场景：管理员在宗门事务页面添加新弟子。
   */
  addDisciple: async (disciple: Omit<Disciple, "id">) => {
    // 与 updateDisciple 一致：提交前将中文角色名转换为后端英文字段
    const body = transformDiscipleForUpdate(disciple);
    const data = await request<any>("/sect/disciples", {
      method: "POST",
      body: JSON.stringify(body),
    }, true);
    return transformDiscipleFromBackend(data);
  },

  /**
   * 获取弟子历史记录（需认证）
   * 
   * @param id - 弟子 ID
   * @returns 弟子历史记录列表
   * @throws Error - 用户未登录时抛出
   */
  getDiscipleHistory: async (id: string) => {
    return await request<any[]>(`/sect/disciples/${id}/history`, undefined, true);
  },

  /**
   * 获取所有弟子历史记录（需认证，仅宗主可用）
   * 
   * @param page - 页码
   * @param size - 每页数量
   * @returns 所有弟子历史记录列表
   * @throws Error - 用户未登录时抛出
   */
  getAllDiscipleHistory: async (page: number = 1, size: number = 20) => {
    return await request<any[]>(`/sect/disciples/history/all?page=${page}&size=${size}`, undefined, true);
  },

  /**
   * 添加新峰（需认证）
   * 
   * @param name - 峰名称
   * @param description - 峰描述
   * @returns 创建的峰对象
   * @throws Error - 用户未登录、无权限或参数错误时抛出
   */
  addPeak: async (name: string, description?: string) => {
    const data = await request<any>("/rbac/peaks", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }, true);
    return {
      id: String(data.id),
      name: data.name,
      description: data.description || "",
      memberCount: 0,
    } as PeakInfo;
  },

  /**
   * 删除峰（需认证）
   * 
   * @param id - 峰 ID
   * @returns true 表示删除成功
   * @throws Error - 用户未登录、无权限或峰下有弟子时抛出
   */
  deletePeak: async (id: string) => {
    const data = await request<boolean>(`/rbac/peaks/${id}`, { method: "DELETE" }, true);
    return data;
  },
};