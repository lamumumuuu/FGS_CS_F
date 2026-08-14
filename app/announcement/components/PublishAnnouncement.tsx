// app/announcement/components/PublishAnnouncement.tsx

/**
 * 发布公告弹窗（独立组件）
 *
 * 羊皮纸风格，包含：
 * - 发布者信息卡片（用户名、所在峰、角色，数据均从后端获取）
 * - 公告范围选择（宗门/本峰，根据权限动态显示）
 * - 公告标题与内容编辑
 * - 删除公告按钮（编辑模式）
 * - 取消/提交按钮
 */

"use client";

import { useRef } from "react";
import Modal from "@/components/Modal";
import type { CreateAnnouncementRequest, Announcement } from "@/app/api/client/modules/announcement";
import type { BackendUser } from "@/types/user";

interface PublishAnnouncementProps {
  isOpen: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  formError: string;
  submitting: boolean;
  /** 当前用户信息（从 PermissionContext 获取） */
  user: BackendUser | null;
  /** 公告表单数据 */
  form: CreateAnnouncementRequest;
  onFormChange: (form: CreateAnnouncementRequest) => void;
  /** 用户角色显示名列表（从 PermissionContext roles 动态获取） */
  roleDisplayNames: string[];
  /** 用户所属峰名称列表（从数据库 peaks 动态获取） */
  peakDisplayNames: string[];
  canAnnounceGlobal: boolean;
  canAnnouncePeak: boolean;
  /** 正在编辑的公告（为 null 表示新建模式） */
  editingAnnouncement?: Announcement | null;
  /** 删除公告回调（编辑模式可用） */
  onDelete?: (ann: Announcement) => void;
}

export default function PublishAnnouncement({
  isOpen,
  onSubmit,
  onCancel,
  formError,
  submitting,
  user,
  form,
  onFormChange,
  roleDisplayNames,
  peakDisplayNames,
  canAnnounceGlobal,
  canAnnouncePeak,
  editingAnnouncement,
  onDelete,
}: PublishAnnouncementProps) {
  const title = editingAnnouncement ? "编辑公告" : "发布公告";
const contentRef = useRef<HTMLTextAreaElement>(null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      containerStyle={{ backgroundColor: "#f2e2c1" }}
    >
      <div className="space-y-5">
        {/* 错误提示 */}
        {formError && (
          <div className="p-3 bg-red-50 border border-red-400 rounded-lg text-red-600 text-sm">
            {formError}
          </div>
        )}

        {/* 发布者信息卡片 */}
        <div className="p-5 bg-[#f2e2c1]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-400">
            <h3 className="text-lg font-bold text-[#2d1f10]">发布者信息</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-2xl border border-gray-400">
                👤
              </div>
              <div>
                <div className="font-bold text-[#2d1f10]">{user?.username || "未知"}</div>
                <div className="text-sm text-gray-600">发布者</div>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <div className="text-sm text-[#2d1f10]">
                <span className="text-gray-600">所在峰：</span>
                <span className="font-medium">{peakDisplayNames?.length ? peakDisplayNames.join("、") : "无"}</span>
              </div>
              <div className="text-sm text-[#2d1f10]">
                <span className="text-gray-600">角色：</span>
                <span className="font-medium">{roleDisplayNames?.length ? roleDisplayNames.join("、") : "外门弟子"}</span>
              </div>
            </div>
          </div>
          <div className="border-t-2 border-gray-600 my-4" />
        </div>

        {/* 公告范围 */}
        <div>
          <label className="block text-sm font-medium text-[#2d1f10] mb-2">
            公告范围 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            {canAnnouncePeak && (
              <label
                className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                  form.type === "peak"
                    ? "border-amber-500 bg-amber-100"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name="announcementType"
                  value="peak"
                  checked={form.type === "peak"}
                  onChange={() => onFormChange({ ...form, type: "peak" })}
                  className="accent-amber-600"
                />
                <span className="text-sm font-medium text-[#2d1f10]">本峰公告</span>
              </label>
            )}
            {canAnnounceGlobal && (
              <label
                className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                  form.type === "global"
                    ? "border-amber-500 bg-amber-100"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name="announcementType"
                  value="global"
                  checked={form.type === "global"}
                  onChange={() => onFormChange({ ...form, type: "global" })}
                  className="accent-amber-600"
                />
                <span className="text-sm font-medium text-[#2d1f10]">宗门公告</span>
              </label>
            )}
          </div>
        </div>

        {/* 公告标题 */}
        <div>
          <label className="block text-sm font-medium text-[#2d1f10] mb-1">
            公告标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => onFormChange({ ...form, title: e.target.value })}
            placeholder="请输入公告标题..."
            className={`w-full px-4 py-2.5 border rounded-lg bg-[#ecdbb5] text-[#2d1f10] placeholder-[#6b5740] focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm ${
              form.title && form.title.trim().length < 2 ? "border-red-400" : "border-[#3d2b1f]"
            }`}
            maxLength={100}
          />
          <div className="flex items-center justify-between mt-1">
            {form.title && form.title.trim().length < 2 ? (
              <p className="text-sm text-red-500">标题至少2个字符</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-[#6b5740]">{form.title.length}/100</span>
          </div>
        </div>

        {/* 公告内容 */}
        <div>
          <label className="block text-sm font-medium text-[#2d1f10] mb-1">
            公告内容 <span className="text-red-500">*</span>
          </label>
<textarea
  ref={contentRef}
  value={form.content}
  onChange={(e) => {
    onFormChange({ ...form, content: e.target.value });
    // 自动调整高度，避免滚动条
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = contentRef.current.scrollHeight + "px";
    }
  }}
  rows={5}
  placeholder="请详细描述公告内容..."
  className={`w-full px-4 py-2.5 border rounded-lg bg-[#ecdbb5] text-[#2d1f10] placeholder-[#6b5740] focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none overflow-hidden ${
    form.content && form.content.trim().length < 5 ? "border-red-400" : "border-[#3d2b1f]"
  }`}
/>
          <div className="flex items-center justify-between mt-1">
            {form.content && form.content.trim().length < 5 ? (
              <p className="text-sm text-red-500">内容至少5个字符</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-[#6b5740]">{form.content.length} 字</span>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="text-sm text-gray-600 pt-4 border-t border-gray-400">
          <p className="mt-1">💡 宗门公告面向全体成员，本峰公告仅面向所属峰成员</p>
        </div>

        {/* 取消 / 删除 / 确认按钮 */}
        <div className="flex gap-3 pt-2">
          {editingAnnouncement && (
            <button
              onClick={() => {
                const ann = editingAnnouncement;
                if (ann && confirm(`确定要删除公告「${ann.title}」吗？此操作不可撤销。`)) {
                  onDelete?.(ann);
                }
              }}
              className="px-4 py-2.5 text-red-600 border border-red-400 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
            >
              删除公告
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-[#3d2b1f] text-[#2d1f10] rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 text-white rounded-lg transition-all font-medium disabled:opacity-50 bg-amber-700 hover:bg-amber-800"
          >
            {submitting
              ? (editingAnnouncement ? "保存中..." : "发布中...")
              : (editingAnnouncement ? "保存修改" : "📜 发布公告")}
          </button>
        </div>
      </div>
    </Modal>
  );
}