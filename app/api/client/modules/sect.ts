// app/api/client/modules/sect.ts

/**
 * 宗门事务 API（统一组织契约）
 *
 * - 读：/api/organization/{me,peaks,members}
 * - 写：/api/admin/organization/{members,peaks}
 *
 * 账号由本人注册，组织侧只负责成员档案与峰归属；角色改由统一授权中心管理，
 * 因此成员编辑只提交学号与所属峰，不再提交角色/姓名。
 */

import { Disciple, PeakInfo, CurrentUser, SectPeak } from "@/types/sect";
import { nativeRequest } from "../core/native";

interface OrgPeakRow {
  id: number;
  code: string;
  name: string;
  fantasyName?: string | null;
  description?: string | null;
  isActive?: boolean;
}

interface OrgMemberRow {
  id: number;
  userId: number;
  username: string;
  displayName?: string | null;
  studentId?: string | null;
  peakId?: number | null;
  peakName?: string | null;
  membershipStatus: string;
  joinedAt?: string | null;
}

interface OrgMeResponse {
  userId: number;
  username: string;
  displayName?: string | null;
  member?: OrgMemberRow | null;
  bindings?: Array<{
    roleName?: string;
    displayName?: string | null;
    fantasyDisplayName?: string | null;
    scopeType?: string;
  }>;
}

const PAGE_LIMIT = 500;

let peakCache: OrgPeakRow[] | null = null;

function peakDisplayName(peak: OrgPeakRow): string {
  return peak.fantasyName || peak.name;
}

function invalidatePeakCache(): void {
  peakCache = null;
}

async function loadOrgPeaks(force = false): Promise<OrgPeakRow[]> {
  if (!peakCache || force) {
    const body = await nativeRequest<{ items?: OrgPeakRow[] }>(
      `/api/organization/peaks?limit=100`,
    );
    peakCache = body.items ?? [];
  }
  return peakCache;
}

async function resolvePeakId(name: string): Promise<number> {
  const peaks = await loadOrgPeaks();
  const row = peaks.find(
    (peak) =>
      peakDisplayName(peak) === name || peak.name === name || peak.code === name,
  );
  if (!row) throw new Error(`未找到峰：${name}`);
  return row.id;
}

function toDisciple(row: OrgMemberRow): Disciple {
  return {
    id: String(row.id),
    name: row.displayName || row.username,
    studentId: row.studentId || "",
    role: "成员",
    peak: row.peakName || "无",
    joinedAt: row.joinedAt ? new Date(row.joinedAt).toLocaleDateString() : "",
    userId: row.userId,
    lingshi: 0,
  };
}

async function listMembers(query: Record<string, string> = {}): Promise<Disciple[]> {
  const params = new URLSearchParams({ limit: String(PAGE_LIMIT), ...query });
  const body = await nativeRequest<{ items?: OrgMemberRow[] }>(
    `/api/organization/members?${params.toString()}`,
  );
  return (body.items ?? []).map(toDisciple);
}

export interface OrganizationHistoryItem {
  id: number;
  action: string;
  actorUsername?: string | null;
  resourceId?: string | null;
  detail?: Record<string, unknown> | null;
  createdAt?: string | null;
}

export const sectApi = {
  /** 当前用户的宗门信息：成员档案 + 首个角色展示名 + 所属峰 */
  getCurrentUser: async (): Promise<CurrentUser> => {
    const me = await nativeRequest<OrgMeResponse>("/api/organization/me");
    const bindings = me.bindings ?? [];
    const role =
      bindings.find((item) => item.fantasyDisplayName)?.fantasyDisplayName ||
      bindings.find((item) => item.displayName)?.displayName ||
      "成员";
    return {
      id: String(me.member?.id ?? me.userId),
      name: me.displayName || me.username,
      role: role as CurrentUser["role"],
      peak: me.member?.peakName || "无",
      permissions: [],
    };
  },

  /** 全部成员 */
  getAllDisciples: () => listMembers(),

  /** 按峰名称筛选成员 */
  getDisciplesByPeak: async (peak: SectPeak) => {
    const peakId = await resolvePeakId(peak);
    return listMembers({ peak_id: String(peakId) });
  },

  /** 全部峰（含在册成员数） */
  getAllPeaks: async (): Promise<PeakInfo[]> => {
    const [peaks, members] = await Promise.all([loadOrgPeaks(), listMembers()]);
    const counts = new Map<string, number>();
    members.forEach((member) => {
      counts.set(member.peak, (counts.get(member.peak) || 0) + 1);
    });
    return peaks.map((peak) => ({
      id: String(peak.id),
      name: peakDisplayName(peak),
      description: peak.description || "",
      memberCount: counts.get(peakDisplayName(peak)) || 0,
    }));
  },

  /** 关键词搜索成员 */
  searchDisciples: (keyword: string) => listMembers({ q: keyword }),

  /** 按峰筛选（"全部" 返回全部成员） */
  filterDisciplesByPeak: async (peak: SectPeak | "全部") => {
    if (peak === "全部") return listMembers();
    const peakId = await resolvePeakId(peak);
    return listMembers({ peak_id: String(peakId) });
  },

  /**
   * 更新成员档案：仅学号与所属峰。
   * 姓名属于账号资料、角色属于统一授权，均不在组织成员接口内修改。
   */
  updateDisciple: async (id: string, disciple: Partial<Disciple>) => {
    const body: Record<string, unknown> = {};
    if (disciple.studentId !== undefined) body.studentId = disciple.studentId;
    if (disciple.peak !== undefined) {
      body.peakId = disciple.peak === "无" ? null : await resolvePeakId(disciple.peak);
    }
    const row = await nativeRequest<OrgMemberRow>(
      `/api/admin/organization/members/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
    return toDisciple(row);
  },

  /** 移动成员到另一峰 */
  moveDisciplePeak: async (discipleId: string, newPeak: SectPeak) => {
    const peakId = await resolvePeakId(newPeak);
    await nativeRequest(`/api/admin/organization/members/${discipleId}/move`, {
      method: "POST",
      body: JSON.stringify({ peakId }),
    });
    return true;
  },

  /** 成员离会：保留账号与历史，仅结束成员关系 */
  deleteDisciple: async (discipleId: string) => {
    await nativeRequest(`/api/admin/organization/members/${discipleId}/remove`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return true;
  },

  /**
   * 将已注册账号加入本峰。
   * `name` 视为登录用户名：先在统一账号中查找，再加入成员（不再创建默认密码账号）。
   */
  addDisciple: async (disciple: Omit<Disciple, "id">) => {
    const username = disciple.name.trim();
    // RecipientOut 为 snake_case 出参（非 TZModel），这里兼容两种写法
    const candidates = await nativeRequest<
      Array<{
        userId?: number;
        user_id?: number;
        username: string;
        displayName?: string;
        display_name?: string;
      }>
    >(`/api/wallet/recipients?q=${encodeURIComponent(username)}`);
    const account =
      candidates.find((item) => item.username === username) ??
      (candidates.length === 1 ? candidates[0] : undefined);
    const accountUserId = account?.userId ?? account?.user_id;
    if (!account || !accountUserId) {
      throw new Error("未找到该账号：请先让成员用该用户名自行注册，再加入成员");
    }
    const peakId =
      disciple.peak && disciple.peak !== "无"
        ? await resolvePeakId(disciple.peak)
        : undefined;
    const row = await nativeRequest<OrgMemberRow>("/api/admin/organization/members", {
      method: "POST",
      body: JSON.stringify({
        userId: accountUserId,
        peakId,
        studentId: disciple.studentId || undefined,
      }),
    });
    return toDisciple(row);
  },

  /** 创建峰（统一 code + 展示名） */
  addPeak: async (name: string, description?: string) => {
    const code = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const peak = await nativeRequest<OrgPeakRow>("/api/admin/organization/peaks", {
      method: "POST",
      body: JSON.stringify({
        code,
        name,
        fantasyName: name,
        description: description || undefined,
      }),
    });
    invalidatePeakCache();
    return {
      id: String(peak.id),
      name: peakDisplayName(peak),
      description: peak.description || "",
      memberCount: 0,
    } as PeakInfo;
  },

  /** 组织历史（audit:read + 全范围；峰范围账号会收到 403） */
  getOrganizationHistory: async (limit = 20) => {
    const body = await nativeRequest<{ items?: OrganizationHistoryItem[] }>(
      `/api/admin/organization/history?limit=${limit}`,
    );
    return body.items ?? [];
  },

  /** 归档峰（有在册成员或余额时后端拒绝） */
  deletePeak: async (id: string) => {
    await nativeRequest(`/api/admin/organization/peaks/${id}/archive`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    invalidatePeakCache();
    return true;
  },
};
