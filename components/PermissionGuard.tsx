// components/PermissionGuard.tsx

/**
 * 权限守卫组件
 * 
 * 根据当前用户的权限/角色决定是否渲染子内容。
 * 支持同时校验权限、单个角色或多个角色。
 * 加载中或无权限时显示 fallback（默认 null）。
 */

"use client";

import { ReactNode, useMemo } from "react";
import { usePermission } from "@/contexts/PermissionContext";

interface PermissionGuardProps {
  permission?: string;              /// 需要的单个权限 key
  role?: string;                    /// 需要的单个角色 key
  roles?: string[];                 /// 需要拥有其中任意一个角色
  fallback?: ReactNode;             /// 无权限时显示的内容
  children: ReactNode;              /// 有权限时渲染的子节点
}

export function PermissionGuard({
  permission,
  role,
  roles,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasRole, hasAnyRole, loading } = usePermission();

  /** 计算是否有访问权限，权限加载中返回 false */
  const hasAccess = useMemo(() => {
    if (loading) {
      return false;                 /// 避免权限未加载时误展示受保护内容
    }

    if (permission) {
      if (!hasPermission(permission)) {
        return false;
      }
    }

    if (role) {
      if (!hasRole(role)) {
        return false;
      }
    }

    if (roles && roles.length > 0) {
      if (!hasAnyRole(...roles)) {
        return false;
      }
    }

    // 若未传任何限制条件，默认允许
    if (!permission && !role && (!roles || roles.length === 0)) {
      return true;
    }

    return true;
  }, [permission, role, roles, loading, hasPermission, hasRole, hasAnyRole]);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGuard;