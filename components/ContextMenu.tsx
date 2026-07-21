"use client";

import { useEffect, useRef } from "react";
import { ContextMenuItem, Permission, CurrentUser } from "@/types/sect";

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  currentUser: CurrentUser;
  onSelect: (action: string) => void;
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, currentUser, onSelect, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

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

  const visibleItems = items.filter((item) => {
    if (!item.permission) return true;
    return currentUser.permissions.includes(item.permission);
  });

  if (visibleItems.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-amber-100 py-2 min-w-40"
      style={{ left: x, top: y }}
    >
      {visibleItems.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            onSelect(item.action);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2 transition-colors"
        >
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
