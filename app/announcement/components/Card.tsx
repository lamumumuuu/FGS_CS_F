// app/announcement/components/AnnouncementCard.tsx

/**
 * 单条通用公告 / 活动卡片组件
 *
 * 根据 mode 切换渲染模式：
 * - "announcement"：公告卡片（展示类型标签、标题、内容、发布者、发布时间、编辑/删除按钮）
 * - "event"：活动卡片（展示状态、类型、名称、描述、地点、时间、人数、编辑按钮）
 *
 * 采用与任务大厅一致的深褐色卡片配色。
 */

"use client";

import type { Announcement } from "@/app/api/client/modules/announcement";
import type { Event } from "@/app/api/client/modules/event";
import { formatDate } from "./constants";

/* ---------- 公共属性 ---------- */
interface BaseCardProps {
  /** 卡片渲染模式 */
  mode: "announcement" | "event";
}

/* ---------- 公告专属属性 ---------- */
interface AnnouncementProps extends BaseCardProps {
  mode: "announcement";
  announcement: Announcement;
  /** 公告所属峰名称（已由父组件通过 getPeakName 解析） */
  peakName: string;
  /** 点击公告查看详情回调 */
  onView: (ann: Announcement) => void;
  /** 是否有编辑权限 */
  canEdit: boolean;
  /** 编辑公告回调 */
  onEdit: (ann: Announcement) => void;
  /** 删除公告回调 */
  onDelete: (ann: Announcement) => void;
}

/* ---------- 活动专属属性 ---------- */
interface EventProps extends BaseCardProps {
  mode: "event";
  event: Event;
  /** 当前用户是否有权管理此活动 */
  canManage: boolean;
  /** 编辑活动回调（仅进行中活动显示） */
  onEdit: (e: Event) => void;
  /** 点击活动卡片查看详情 */
  onView: (e: Event) => void;
  /** 根据 peakId 获取峰名称 */
  getPeakName: (id?: number | null) => string;
}

type AnnouncementCardProps = AnnouncementProps | EventProps;

export default function AnnouncementCard(props: AnnouncementCardProps) {
  const { mode } = props;

  if (mode === "announcement") {
    const ann = props.announcement;
    return (
      <div
        className="rounded-xl p-5 transition-all hover:shadow-lg cursor-pointer"
        style={{
          backgroundColor: "#2b1e10",
          border: "1px solid #332418",
        }}
        onClick={() => props.onView(ann)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium font-shan"
                style={{
                  backgroundColor: ann.type === "global" ? "rgba(212, 165, 116, 0.15)" : "rgba(185, 76, 0, 0.15)",
                  color: ann.type === "global" ? "#d4a574" : "#f0a060",
                }}
              >
                {ann.type === "global" ? "宗门" : `本峰${ann.peakId ? `(${props.peakName})` : ""}`}
              </span>
              <h3 className="text-lg font-bold font-shan" style={{ color: "#f0e6c8" }}>
                {ann.title}
              </h3>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-3 cursor-pointer" style={{ color: "#d0b890" }}>
              {ann.content}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid #332418" }}>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "#8a7456" }}>
              发布者：{ann.publisherName || "未知"}
            </span>
            {props.canEdit && (
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); props.onEdit(ann); }}
                  className="text-xs px-2 py-0.5 rounded font-shan transition-all"
                  style={{ backgroundColor: "rgba(212, 165, 116, 0.1)", color: "#d4a574", border: "1px solid rgba(212, 165, 116, 0.2)" }}
                >
                  编辑
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); props.onDelete(ann); }}
                  className="text-xs px-2 py-0.5 rounded font-shan transition-all"
                  style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#f87171", border: "1px solid rgba(220, 38, 38, 0.2)" }}
                >
                  删除
                </button>
              </div>
            )}
          </div>
          <span className="text-xs" style={{ color: "#8a7456" }}>
            {formatDate(ann.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  // mode === "event"
  const evt = props.event;

  return (
    <div
      className="rounded-xl p-5 transition-all hover:shadow-lg"
      style={{
        backgroundColor: "#2b1e10",
        border: "1px solid #332418",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 cursor-pointer" onClick={() => props.onView(evt)}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {(evt.status === "completed" || evt.status === "cancelled") && (
              <span className="px-2 py-0.5 rounded text-xs font-medium font-shan"
                style={{ backgroundColor: "#6b728022", color: "#6b7280" }}>
                已结束活动
              </span>
            )}
            <span
              className="px-2 py-0.5 rounded text-xs font-medium font-shan"
              style={{
                backgroundColor: evt.type === "global" ? "rgba(212, 165, 116, 0.15)" : "rgba(185, 76, 0, 0.15)",
                color: evt.type === "global" ? "#d4a574" : "#f0a060",
              }}
            >
              {evt.type === "global" ? "宗门" : `本峰${evt.peakId ? `(${props.getPeakName(evt.peakId)})` : ""}`}
            </span>
            <h3 className="text-lg font-bold font-shan" style={{ color: "#f0e6c8" }}>
              {evt.name}
            </h3>
          </div>
          {evt.description && (
            <p className="text-sm mb-2 leading-relaxed" style={{ color: "#d0b890" }}>
              {evt.description}
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "#8a7456" }}>
            {evt.location && <span>📍 {evt.location}</span>}
            {evt.startTime && <span>🕐 {formatDate(evt.startTime)}</span>}
            {evt.maxParticipants != null && <span>👥 限额 {evt.maxParticipants} 人</span>}
          </div>
        </div>
        {props.canManage && evt.status !== "completed" && evt.status !== "cancelled" && (
          <div className="flex flex-col gap-2 ml-2 flex-shrink-0">
            <button
              onClick={() => props.onEdit(evt)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all font-shan"
              style={{
                backgroundColor: "rgba(212, 165, 116, 0.1)",
                color: "#d4a574",
                border: "1px solid rgba(212, 165, 116, 0.2)",
              }}
            >
              编辑
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid #332418" }}>
        <span className="text-xs" style={{ color: "#8a7456" }}>
          组织者：{evt.organizerName || "未知"}
        </span>
        <span className="text-xs" style={{ color: "#8a7456" }}>
          {formatDate(evt.createdAt)}
        </span>
      </div>
    </div>
  );
}
