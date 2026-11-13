// app/api/client/modules/user.ts

/**
 * 用户认证 API 模块（同源 BFF + HttpOnly Cookie）
 *
 * 登录/登出/当前用户不再读写 localStorage token；身份与权限由 BFF 读取 Cookie。
 * 旧 localStorage 键在登出时清理一次，兼容从旧版本升级的浏览器。
 */

import { UserInfoResponse } from "@/types/user";
import type { BackendUser } from "@/types/user";
import type { Role, Permission } from "@/types/rbac";

/** 清理旧版本遗留的 localStorage 键（token / 权限缓存）。 */
function clearLegacyAuthStorage(): void {
  if (typeof window === "undefined") return;
  for (const key of ["fgscs_token", "fgscs_refresh_token", "fgscs_permissions"]) {
    window.localStorage.removeItem(key);
  }
}

async function bffJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  if (!res.ok) {
    throw new Error(
      (data?.message as string | undefined) ??
        (data?.error as string | undefined) ??
        `请求失败 (${res.status})`,
    );
  }
  return data as T;
}

async function verifyTwoFactor(twoFactorToken: string): Promise<void> {
  const code = window.prompt("该账号已启用两步验证，请输入 6 位验证码");
  if (!code) throw new Error("已取消两步验证");
  await bffJson("/api/auth/2fa/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ two_factor_token: twoFactorToken, code }),
  });
}

export const userApi = {
  /** 当前用户 + 权限（BFF Cookie 身份） */
  getCurrentUser: async (): Promise<UserInfoResponse> => {
    const me = await bffJson<{ user?: Record<string, unknown>; roles?: string[] }>("/api/auth/me");
    const perms = await bffJson<{ permissions?: string[] }>("/api/rbac/me/permissions").catch(
      () => ({ permissions: [] }),
    );
    const raw = me.user ?? {};
    const user: BackendUser = {
      id: String(raw.id ?? ""),
      username: String(raw.username ?? ""),
      avatar: String(raw.avatarUrl ?? raw.avatar_url ?? ""),
      role: 0,
      status: 1,
    };
    const permissionNames = perms.permissions ?? [];
    return {
      user,
      roles: [] as Role[],
      roleNames: Array.isArray(me.roles) ? me.roles : [],
      permissions: permissionNames.map((name) => ({ name } as unknown as Permission)),
      permissionNames,
      peakIds: [],
      isGlobal: permissionNames.includes("*:*"),
    };
  },

  /** 登录：BFF 写入 HttpOnly Cookie；需要 2FA 时完成验证后重试 */
  login: async (credentials: { username: string; password: string }) => {
    const result = await bffJson<{ requires2fa?: boolean; twoFactorToken?: string }>(
      "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      },
    );
    if (result.requires2fa) {
      if (!result.twoFactorToken) throw new Error("两步验证凭证缺失");
      await verifyTwoFactor(result.twoFactorToken);
    }
    return { requires2fa: false };
  },

  /** 发送注册邮箱验证码 */
  sendCode: async (email: string): Promise<void> => {
    await bffJson("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  },

  /** 注册：邮箱 + 密码 + 邮箱验证码；BFF 注册成功后直接写入 Cookie */
  register: async (data: {
    email: string;
    password: string;
    code: string;
  }): Promise<string> => {
    await bffJson("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return "注册成功";
  },

  logout: async (): Promise<void> => {
    try {
      await bffJson("/api/auth/logout", { method: "POST" });
    } finally {
      clearLegacyAuthStorage();
    }
  },
};
