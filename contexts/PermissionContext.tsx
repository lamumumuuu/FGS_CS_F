// contexts/PermissionContext.tsx

/**
 * 全局权限上下文（统一后端 + HttpOnly Cookie BFF）
 *
 * 浏览器不再持有 localStorage token：身份来自同源 /api/auth/me，
 * 权限来自 /api/rbac/me/permissions，作用范围来自 /api/rbac/me/bindings。
 * 对子组件保持既有 hasPermission/hasRole 接口，避免页面级大改。
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  useMemo,
} from "react";
import { BackendUser } from "@/types/user";
import { Role, Permission } from "@/types/rbac";

interface PermissionContextType {
  user: BackendUser | null;
  roles: Role[];
  roleNames: string[];
  permissions: Permission[];
  permissionNames: string[];
  peakIds: number[];
  isGlobal: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
  refreshLingshi: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  subscribeToUserData: (callback: (user: BackendUser | null) => void) => () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined
);

async function bffJson<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T | null }> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : null;
  return { ok: res.ok, status: res.status, data };
}

function toBackendUser(raw: Record<string, unknown>, lingshi = 0): BackendUser {
  return {
    id: String(raw.id ?? ""),
    username: String(raw.username ?? ""),
    avatar: String(raw.avatarUrl ?? raw.avatar_url ?? ""),
    role: 0,
    status: 1,
    createTime: String(raw.createdAt ?? raw.created_at ?? ""),
    updateTime: String(raw.updatedAt ?? raw.updated_at ?? ""),
    lingshi,
  };
}

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionNames, setPermissionNames] = useState<string[]>([]);
  const [peakIds, setPeakIds] = useState<number[]>([]);
  const [isGlobal, setIsGlobal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subscribersRef = useRef<Array<(user: BackendUser | null) => void>>([]);

  const notifySubscribers = useCallback((u: BackendUser | null) => {
    subscribersRef.current.forEach((cb) => {
      try {
        cb(u);
      } catch (e) {
        console.warn("用户数据订阅回调执行失败:", e);
      }
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const resetPermissions = useCallback(() => {
    setUser(null);
    setRoles([]);
    setRoleNames([]);
    setPermissions([]);
    setPermissionNames([]);
    setPeakIds([]);
    setIsGlobal(false);
    setIsAuthenticated(false);
    notifySubscribers(null);
  }, [notifySubscribers]);

  const refreshPermissions = useCallback(async () => {
    setError(null);
    try {
      const me = await bffJson<{ user?: Record<string, unknown>; roles?: string[] }>("/api/auth/me");
      if (me.status === 401) {
        resetPermissions();
        return;
      }
      if (!me.ok || !me.data?.user) {
        resetPermissions();
        setError("获取用户信息失败");
        return;
      }
      const [perm, bindings, wallet] = await Promise.all([
        bffJson<{ permissions?: string[] }>("/api/rbac/me/permissions"),
        bffJson<{ bindings?: Array<Record<string, unknown>> }>("/api/rbac/me/bindings"),
        bffJson<{ balance?: string }>("/api/wallet/me"),
      ]);

      const names = perm.ok && Array.isArray(perm.data?.permissions) ? perm.data!.permissions! : [];
      const bindingRows = bindings.ok && Array.isArray(bindings.data?.bindings) ? bindings.data!.bindings! : [];
      const peaks = bindingRows
        .map((row) => Number(row.scopePeakId ?? row.scope_peak_id ?? 0))
        .filter((id) => id > 0);
      const global = names.includes("*:*") || bindingRows.some((row) => String(row.scopeType ?? row.scope_type ?? "") === "all");

      const nextUser = toBackendUser(me.data.user, Number(wallet.data?.balance ?? 0));
      setUser(nextUser);
      setRoleNames(Array.isArray(me.data.roles) ? me.data.roles : []);
      setRoles([]);
      setPermissionNames(names);
      setPermissions(names.map((name) => ({ name } as unknown as Permission)));
      setPeakIds(Array.from(new Set(peaks)));
      setIsGlobal(global);
      setIsAuthenticated(true);
      notifySubscribers(nextUser);
    } catch (err: unknown) {
      console.error("刷新权限失败:", err);
      resetPermissions();
      setError(err instanceof Error ? err.message : "获取权限信息失败，请重新登录");
    } finally {
      setLoading(false);
    }
  }, [resetPermissions, notifySubscribers]);

  const refreshLingshi = useCallback(async () => {
    const wallet = await bffJson<{ balance?: string }>("/api/wallet/me");
    if (!wallet.ok) return;
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, lingshi: Number(wallet.data?.balance ?? 0) };
      notifySubscribers(next);
      return next;
    });
  }, [notifySubscribers]);

  const logout = useCallback(async () => {
    try {
      await bffJson("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("登出接口调用失败，强制清除本地状态:", err);
    } finally {
      resetPermissions();
      setLoading(false);
    }
  }, [resetPermissions]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!permission || !permission.trim()) return false;
      if (!isAuthenticated) return false;
      return permissionNames.includes("*:*") || permissionNames.includes(permission);
    },
    [permissionNames, isAuthenticated]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!role || !role.trim() || !isAuthenticated) return false;
      return roleNames.includes(role);
    },
    [roleNames, isAuthenticated]
  );

  const hasAnyRole = useCallback(
    (...rolesToCheck: string[]): boolean => {
      if (!rolesToCheck.length || !isAuthenticated) return false;
      return rolesToCheck.some((r) => roleNames.includes(r));
    },
    [roleNames, isAuthenticated]
  );

  const subscribeToUserData = useCallback(
    (callback: (user: BackendUser | null) => void) => {
      subscribersRef.current.push(callback);
      try {
        callback(user);
      } catch (e) {
        console.warn("用户数据初始推送失败:", e);
      }
      return () => {
        subscribersRef.current = subscribersRef.current.filter((cb) => cb !== callback);
      };
    },
    [user]
  );

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!mounted) return;
      await refreshPermissions();
    };
    init();
    return () => {
      mounted = false;
    };
  }, [refreshPermissions]);

  const value = useMemo<PermissionContextType>(
    () => ({
      user,
      roles,
      roleNames,
      permissions,
      permissionNames,
      peakIds,
      isGlobal,
      isAuthenticated,
      loading,
      error,
      hasPermission,
      hasRole,
      hasAnyRole,
      refreshPermissions,
      refreshLingshi,
      logout,
      clearError,
      subscribeToUserData,
    }),
    [
      user,
      roles,
      roleNames,
      permissions,
      permissionNames,
      peakIds,
      isGlobal,
      isAuthenticated,
      loading,
      error,
      hasPermission,
      hasRole,
      hasAnyRole,
      refreshPermissions,
      refreshLingshi,
      logout,
      clearError,
      subscribeToUserData,
    ]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermission() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermission must be used within a PermissionProvider");
  }
  return context;
}
