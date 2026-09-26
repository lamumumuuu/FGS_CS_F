// app/api/client/modules/finance.ts

/**
 * 财务 API 模块
 * 
 * 提供灵石流水查询、调整、分配、调拨等财务相关接口封装。
 * 对应后端 FinanceController。
 */

import { request } from "../core/request";

export const financeApi = {
  /**
   * 获取灵石调整日志（支持按类型和峰筛选）
   * 权限：finance:view_all（全部财务）/ finance:view_own_peak（指定峰）
   * category: all-全部, personal-个人相关
   */
  getAdjustments: async (type?: string, peakId?: number, category?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (peakId) params.append("peakId", String(peakId));
    if (category) params.append("category", category);
    if (limit) params.append("limit", String(limit));
    const query = params.toString();
    return await request<any[]>(`/finance/adjustments${query ? '?' + query : ''}`, undefined, true);
  },

  /**
   * 获取当前峰灵石调整日志（仅峰财务权限用户可访问）
   * 权限：finance:view_own_peak
   */
  getPeakAdjustments: async (type?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (limit) params.append("limit", String(limit));
    const query = params.toString();
    return await request<any[]>(`/finance/peak-adjustments${query ? '?' + query : ''}`, undefined, true);
  },

  /**
   * 获取灵石流水列表
   */
  getTransactions: async (type?: string) => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    const query = params.toString();
    return await request<any[]>(`/finance/transactions${query ? '?' + query : ''}`, undefined, true);
  },

  /**
   * 获取指定弟子的灵石流水
   */
  getDiscipleTransactions: async (discipleId: string) => {
    return await request<any[]>(`/finance/disciple/${discipleId}/transactions`, undefined, true);
  },

  /**
   * 调整灵石（管理员操作）
   */
  adjustLingshi: async (data: { discipleId: number; amount: number; remark?: string }) => {
    return await request<any>("/finance/adjust", {
      method: "POST",
      body: JSON.stringify(data),
    }, true);
  },

  /* ========== 以下为新增接口：峰级财务管理 ========== */

  /**
   * 获取总可支配灵石（宗门公共）
   * 权限：finance:view_all
   */
  getTotalDisposable: async () => {
    return await request<{ total: number; description: string }>("/finance/total-disposable", undefined, true);
  },

  /**
   * 获取所有峰的财务数据（峰列表）
   * 权限：finance:view_all
   */
  getPeaksFinanceData: async () => {
    return await request<any[]>("/finance/peaks", undefined, true);
  },

  /**
   * 获取指定峰的财务数据
   * 权限：finance:view_own_peak
   */
  getPeakData: async (peakId: number) => {
    return await request<any>(`/finance/peak/${peakId}`, undefined, true);
  },

  /**
   * 获取指定峰的成员列表
   * 权限：finance:view_own_peak
   */
  getPeakMembers: async (peakId: number) => {
    return await request<any[]>(`/finance/peak/${peakId}/members`, undefined, true);
  },

  /**
   * 灵石分配：从总可支配灵石分配至指定峰
   * 权限：finance:adjust_lingshi
   */
  allocateToPeak: async (data: { peakId: number; amount: number; remark?: string }) => {
    return await request<any>("/finance/allocate-to-peak", {
      method: "POST",
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * 峰间灵石调拨
   * 权限：finance:adjust_lingshi
   */
  peakTransfer: async (data: { fromPeakId: number; toPeakId: number; amount: number; remark?: string }) => {
    return await request<any>("/finance/peak-transfer", {
      method: "POST",
      body: JSON.stringify(data),
    }, true);
  },
};
