"use client";

import { ReactNode, ButtonHTMLAttributes, useCallback } from "react";
import { PermissionGuard } from "@/components/PermissionGuard";
import { useToast } from "@/contexts/ToastContext";

interface PermissionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  buttonVariant?: "primary" | "secondary" | "danger" | "ghost";
  buttonSize?: "sm" | "md" | "lg";
  actionName?: string;
  showToast?: boolean;
}

/**
 * 权限按钮组件
 * 根据权限显示/隐藏按钮，并在无权限时提供友好提示
 *
 * 使用场景：
 * - 操作型按钮（发布、编辑、删除、审核等）
 * - 需要在无权限时显示禁用状态或隐藏
 * - 点击时可触发权限检查 Toast
 */
export function PermissionButton({
  permission,
  children,
  fallback = null,
  buttonVariant = "primary",
  buttonSize = "md",
  actionName,
  showToast = true,
  onClick,
  className = "",
  disabled,
  ...rest
}: PermissionButtonProps) {
  const { showPermissionDenied } = useToast();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(e);
      }
    },
    [onClick]
  );

  const variantClasses = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <PermissionGuard permission={permission} fallback={fallback}>
      <button
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[buttonVariant]} ${sizeClasses[buttonSize]} ${className}`}
        onClick={handleClick}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    </PermissionGuard>
  );
}
