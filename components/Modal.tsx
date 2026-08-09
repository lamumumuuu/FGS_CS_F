// components/Modal.tsx

/**
 * 通用模态框组件
 * 
 * 提供遮罩层、标题栏、内容区。支持尺寸选择与 Esc 关闭。
 * 打开时禁用页面滚动。
 */

"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;                     /// 是否显示模态框
  onClose: () => void;                 /// 关闭回调
  title?: string;                      /// 标题文本
  children: React.ReactNode;           /// 内容
  size?: "sm" | "md" | "lg" | "xl";  /// 尺寸预设
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  /* ------------------------------------------------------------------ */
  /*  打开时绑定 Esc 并禁用背景滚动                                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";      /// 禁止背景页面滚动
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";            /// 恢复滚动
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-5xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩层，点击关闭 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* 模态框主体 */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]`}
      >
        {title && (
          <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}