// components/ContextMenu.tsx

/**
 * 右键菜单组件
 * 
 * 在指定坐标显示一个可自定义的菜单列表。
 * 接收父组件已过滤好的菜单项，点击菜单外部或按下 Esc 关闭。
 */

"use client";

import { useEffect, useRef } from "react";
import { ContextMenuItem } from "@/types/sect";

interface ContextMenuProps {
  x: number;                               /// 菜单左上角 X 坐标（相对于视口）
  y: number;                               /// 菜单左上角 Y 坐标
  items: ContextMenuItem[];                /// 菜单项配置列表（已由父组件过滤权限）
  onSelect: (action: string) => void;      /// 选中菜单项回调，返回 action 标识
  onClose: () => void;                     /// 关闭菜单回调
}

export default function ContextMenu({ x, y, items, onSelect, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);  /// 菜单 DOM 引用，用于判断点击是否在菜单内

  /* ------------------------------------------------------------------ */
  /*  全局事件监听：点击菜单外 / 按下 Esc 关闭菜单                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // 无可显示菜单项时不渲染
  if (items.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-white rounded-lg shadow-xl border py-2 min-w-40"
      style={{
        left: x,
        top: y,
        borderColor: "rgba(15, 118, 110, 0.15)",
        zIndex: 100,
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            onSelect(item.action);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2 transition-colors"
        >
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}