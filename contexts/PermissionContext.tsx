// contexts/PermissionContext.tsx

/**
 * 权限上下文模块
 *
 * 本文件提供全局的权限状态管理，基于 React Context API 实现。
 * 包含：
 * - PermissionProvider : 权限提供者组件，负责从后端获取用户、角色、权限数据，
 *   并通过 Context 向所有子组件注入权限信息与判断方法。
 * - usePermission      : 自定义 Hook，用于在函数组件中获取权限上下文。
 *
 * 核心功能：
 * 1. 初始化时从本地缓存恢复部分权限数据，实现快速渲染；
 * 2. 检测 token 并调用后端接口拉取完整权限数据；
 * 3. 提供 hasPermission、hasRole、hasAnyRole 等权限校验方法；
 * 4. 提供 logout 和 refreshPermissions 等操作；
 * 5. 支持灵石数据实时同步：通过 refreshLingshi 方法可单独刷新灵石数值；
 *    通过 subscribeToUserData 可订阅用户数据变更事件，一处更新处处同步。
 *
 * 使用方式：
 * - 在应用根布局中包裹 <PermissionProvider>...</PermissionProvider>
 * - 子组件内通过 const { hasPermission, isAuthenticated } = usePermission(); 获取权限状态
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
import { userApi, getStoredPermissions } from "@/app/api/client";
import { UserInfoResponse, BackendUser } from "@/types/user";
import { Role, Permission } from "@/types/rbac";

/* ------------------------------------------------------------------ */
/*  对外暴露的上下文类型                                               */
/* ------------------------------------------------------------------ */
interface PermissionContextType {
  user: BackendUser | null;                        /// 当前用户后端原始信息
  roles: Role[];                                   /// 用户角色对象列表
  roleNames: string[];                             /// 用户角色名数组，如 ["sect_master","elder"]
  permissions: Permission[];                       /// 用户细粒度权限对象列表
  permissionNames: string[];                       /// 用户权限名数组，如 ["quest:create_global"]
  peakIds: number[];                               /// 用户所属峰的 ID 数组
  isGlobal: boolean;                               /// 是否拥有全局权限（跨峰操作）
  isAuthenticated: boolean;                        /// 是否已通过认证（登录且权限加载完毕）
  loading: boolean;                                /// 权限数据是否正在加载中
  error: string | null;                            /// 最近一次权限操作产生的错误信息
  hasPermission: (permission: string) => boolean;  /// 判断是否拥有某个权限
  hasRole: (role: string) => boolean;              /// 判断是否拥有某个角色
  hasAnyRole: (...roles: string[]) => boolean;     /// 判断是否拥有任意一个给定角色
  refreshPermissions: () => Promise<void>;         /// 手动重新拉取权限（含灵石数据）
  refreshLingshi: () => Promise<void>;            /// 单独刷新灵石数值（轻量级操作）
  logout: () => Promise<void>;                     /// 登出并清除状态
  clearError: () => void;                          /// 清除错误信息
  subscribeToUserData: (callback: (user: BackendUser | null) => void) => () => void; /// 订阅用户数据变更，返回取消订阅函数
}

/* ------------------------------------------------------------------ */
/*  创建上下文，未包裹 Provider 时值为 undefined                      */
/* ------------------------------------------------------------------ */
const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined
);

const DEFAULT_PEAK_IDS: number[] = [];             /// 峰 ID 默认空数组，兜底使用

/* ------------------------------------------------------------------ */
/*  PermissionProvider —— 全局权限提供者                              */
/* ------------------------------------------------------------------ */
export function PermissionProvider({ children }: { children: ReactNode }) {
  // ==================== 状态定义 ====================
  const [user, setUser] = useState<BackendUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionNames, setPermissionNames] = useState<string[]>([]);
  const [peakIds, setPeakIds] = useState<number[]>([]);
  const [isGlobal, setIsGlobal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);    /// 初始为 true，等待权限初始化完成
  const [error, setError] = useState<string | null>(null);

  // 用户数据订阅者列表，用于实现全局数据同步
  const subscribersRef = useRef<Array<(user: BackendUser | null) => void>>([]);

  /** 通知所有订阅者用户数据变更 */
  const notifySubscribers = useCallback((u: BackendUser | null) => {
    subscribersRef.current.forEach((cb) => {
      try {
        cb(u);
      } catch (e) {
        console.warn("用户数据订阅回调执行失败:", e);
      }
    });
  }, []);

  /* ------------------------------------------------------------------ */
  /*  内部工具方法                                                     */
  /* ------------------------------------------------------------------ */

  /** 清空错误信息，通常在 UI 关闭错误提示时调用 */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /** 重置所有权限相关状态至未登录初始值 */
  const resetPermissions = useCallback(() => {
    setUser(null);
    setRoles([]);
    setRoleNames([]);
    setPermissions([]);
    setPermissionNames([]);
    setPeakIds([]);
    setIsGlobal(false);
    setIsAuthenticated(false);
    notifySubscribers(null);                        /// 通知订阅者用户已清空
  }, [notifySubscribers]);

  /* ------------------------------------------------------------------ */
  /*  本地缓存恢复 —— 用于页面刷新后快速展示缓存权限，减少白屏       */
  /* ------------------------------------------------------------------ */
  const loadPermissionsFromStorage = useCallback(() => {
    try {
      const stored = getStoredPermissions();
      if (stored) {
        setRoleNames(Array.isArray(stored.roleNames) ? stored.roleNames : []);
        setPermissionNames(
          Array.isArray(stored.permissionNames) ? stored.permissionNames : []
        );
        setPeakIds(Array.isArray(stored.peakIds) ? stored.peakIds : DEFAULT_PEAK_IDS);
        setIsGlobal(typeof stored.isGlobal === "boolean" ? stored.isGlobal : false);
        return true;                               /// 成功读取到缓存数据
      }
    } catch (err) {
      console.warn("加载本地权限缓存失败:", err);
    }
    return false;                                  /// 无缓存或读取异常
  }, []);

  /* ------------------------------------------------------------------ */
  /*  核心：从后端获取最新用户与权限数据                                */
  /* ------------------------------------------------------------------ */
  const refreshPermissions = useCallback(async () => {
    setError(null);
    try {
      const token = userApi.getToken();
      if (!token) {
        resetPermissions();                        /// 无 token，视为未登录
        setLoading(false);
        return;
      }

      const data: UserInfoResponse = await userApi.getCurrentUser();

      if (!data || !data.user) {
        resetPermissions();
        setError("获取用户信息失败");
        return;
      }

      // 更新完整状态，数组字段做兜底处理
      setUser(data.user);
      setRoles(Array.isArray(data.roles) ? data.roles : []);
      setRoleNames(Array.isArray(data.roleNames) ? data.roleNames : []);
      setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
      setPermissionNames(
        Array.isArray(data.permissionNames) ? data.permissionNames : []
      );
      setPeakIds(Array.isArray(data.peakIds) ? data.peakIds : DEFAULT_PEAK_IDS);
      setIsGlobal(typeof data.isGlobal === "boolean" ? data.isGlobal : false);
      setIsAuthenticated(true);                    /// 标记认证成功

      // 通知订阅者：用户数据（含灵石）已更新
      notifySubscribers(data.user);
    } catch (err: unknown) {
      console.error("刷新权限失败:", err);
      resetPermissions();
      const message =
        err instanceof Error ? err.message : "获取权限信息失败，请重新登录";
      setError(message);
    } finally {
      setLoading(false);                           /// 加载结束
    }
  }, [resetPermissions, notifySubscribers]);

  /* ------------------------------------------------------------------ */
  /*  灵石轻量刷新 —— 仅刷新 user 中的灵石数值，不触发完整权限重载   */
  /* ------------------------------------------------------------------ */
  const refreshLingshi = useCallback(async () => {
    try {
      const token = userApi.getToken();
      if (!token) return;

      const data: UserInfoResponse = await userApi.getCurrentUser();
      if (data && data.user) {
        // 局部更新 user 对象中的 lingshi 字段，保留其他状态
        setUser((prev) => {
          if (!prev) return data.user;
          // 合并更新，确保灵石及其他可能变动的字段都同步
          return { ...prev, ...data.user, lingshi: data.user.lingshi };
        });
        // 通知订阅者
        notifySubscribers(data.user);
      }
    } catch (err) {
      console.warn("刷新灵石失败:", err);
    }
  }, [notifySubscribers]);

  /* ------------------------------------------------------------------ */
  /*  登出流程                                                         */
  /* ------------------------------------------------------------------ */
  const logout = useCallback(async () => {
    try {
      await userApi.logout();                      /// 调用后端登出接口
    } catch (err) {
      console.warn("登出接口调用失败，强制清除本地状态:", err);
    } finally {
      resetPermissions();                          /// 无论成败均清除前端状态
      setLoading(false);
    }
  }, [resetPermissions]);

  /* ------------------------------------------------------------------ */
  /*  权限判断方法                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * 检查是否拥有某个权限
   * @param permission 权限字符串 key，例如 "quest:publish_global"
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!permission || !permission.trim()) return false;  /// 拒绝空串
      if (!isAuthenticated) return false;                   /// 未认证一律返回 false
      return permissionNames.includes(permission);
    },
    [permissionNames, isAuthenticated]
  );

  /** 检查是否拥有某个角色，例如 "sect_master" */
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!role || !role.trim()) return false;
      if (!isAuthenticated) return false;
      return roleNames.includes(role);
    },
    [roleNames, isAuthenticated]
  );

  /** 检查是否拥有任意一个给定角色（接收可变参数） */
  const hasAnyRole = useCallback(
    (...rolesToCheck: string[]): boolean => {
      if (!rolesToCheck || rolesToCheck.length === 0) return false;
      if (!isAuthenticated) return false;
      return rolesToCheck.some((r) => roleNames.includes(r));
    },
    [roleNames, isAuthenticated]
  );

  /* ------------------------------------------------------------------ */
  /*  用户数据订阅 —— 用于实现全局数据同步                            */
  /* ------------------------------------------------------------------ */
  const subscribeToUserData = useCallback(
    (callback: (user: BackendUser | null) => void) => {
      subscribersRef.current.push(callback);
      // 立即推送一次当前用户数据，便于订阅者同步初始状态
      try {
        callback(user);
      } catch (e) {
        console.warn("用户数据初始推送失败:", e);
      }
      // 返回取消订阅函数
      return () => {
        subscribersRef.current = subscribersRef.current.filter(
          (cb) => cb !== callback
        );
      };
    },
    [user]
  );

  /* ------------------------------------------------------------------ */
  /*  初始化 —— 首次挂载时自动执行                                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;                            /// 防止组件卸载后仍然 setState

    const init = async () => {
      if (!mounted) return;

      const hasStored = loadPermissionsFromStorage();  /// 1. 尝试读取缓存
      const token = userApi.getToken();

      if (token) {
        if (!hasStored) {
          setLoading(true);                        /// 无缓存时开启加载状态
        }
        await refreshPermissions();                /// 2. 从后端拉取最新权限
      } else {
        resetPermissions();                        /// 无 token 直接重置
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [loadPermissionsFromStorage, refreshPermissions, resetPermissions]);

  /* ------------------------------------------------------------------ */
  /*  组装上下文 value，并用 useMemo 避免不必要的子组件重渲染         */
  /* ------------------------------------------------------------------ */
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

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  消费 Hook —— 组件中通过 usePermission() 获取权限上下文           */
/* ------------------------------------------------------------------ */
export function usePermission() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermission must be used within a PermissionProvider");
  }
  return context;
}
