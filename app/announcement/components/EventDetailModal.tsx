// app/announcement/components/EventDetailModal.tsx

/**
 * 活动详情弹窗组件
 *
 * 羊皮纸风格设计，与公告栏页面整体配色一致。
 * 展示活动状态、类型、地点、起止时间、人数（已参加/上限）、描述、组织者，
 * 以及操作按钮（管理用户：编辑；普通用户：加入活动）。
 *
 * 人数显示格式：(已参加人数/人数上限)，数据从后端 participantCount 获取。
 * 加入活动前弹出羊皮纸风格二次确认弹窗，防止误操作。
 */

"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import type { Event } from "@/app/api/client/modules/event";
import { formatDate } from "./constants";

interface EventDetailModalProps {
  /** 正在查看的活动（为 null 时弹窗关闭） */
  event: Event | null;
  onClose: () => void;
  /** 当前用户是否有管理权限 */
  canManage: boolean;
  /** 编辑活动回调（仅进行中活动显示） */
  onEdit: (e: Event) => void;
  /** 加入活动回调（仅进行中活动、非管理用户显示） */
  onJoin: (e: Event) => void;
  /** 根据 peakId 获取峰名称 */
  getPeakName: (id?: number | null) => string;
}

export default function EventDetailModal({
  event,
  onClose,
  canManage,
  onEdit,
  onJoin,
  getPeakName,
}: EventDetailModalProps) {
  const isOpen = event !== null;
  // 加入二次确认弹窗开关
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);

  // 加入活动前弹出二次确认，防止误操作
  const handleJoinClick = () => {
    if (!event) return;
    setShowJoinConfirm(true);
  };

  // 确认加入
  const handleConfirmJoin = () => {
    setShowJoinConfirm(false);
    if (event) onJoin(event);
  };

  // 参加人数显示：(已参加/上限)
  const participantText = (() => {
    if (!event) return "";
    const current = event.participantCount ?? 0;
    if (event.maxParticipants != null) {
      return `${current}/${event.maxParticipants}`;
    }
    return `${current}/不限`;
  })();

  // 活动详情弹窗
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={event?.name || ""}
        containerStyle={{ backgroundColor: "#f2e2c1" }}
        titleStyle={{ color: "#2d1f10" }}
      >
        {event && (
          <div className="space-y-4">
            {/* 状态标签 + 类型标签 */}
            <div className="flex items-center gap-2">
              {(event.status === "completed" || event.status === "cancelled") && (
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: "#6b728022", color: "#6b7280" }}
                >
                  已结束活动
                </span>
              )}
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: event.type === "global" ? "rgba(185, 76, 0, 0.15)" : "rgba(217, 119, 6, 0.15)",
                  color: event.type === "global" ? "#b94c00" : "#92400e",
                }}
              >
                {event.type === "global" ? "宗门活动" : `本峰活动${event.peakId ? `(${getPeakName(event.peakId)})` : ""}`}
              </span>
            </div>

            {/* 时间 / 人数 / 地点 */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {event.startTime && (
                <div>
                  <h4 className="text-xs mb-1" style={{ color: "#6b5740" }}>开始时间</h4>
                  <p className="text-[#2d1f10]">🕐 {formatDate(event.startTime)}</p>
                </div>
              )}
              {event.endTime && (
                <div>
                  <h4 className="text-xs mb-1" style={{ color: "#6b5740" }}>结束时间</h4>
                  <p className="text-[#2d1f10]">🕐 {formatDate(event.endTime)}</p>
                </div>
              )}
              {event.location && (
                <div>
                  <h4 className="text-xs mb-1" style={{ color: "#6b5740" }}>活动地点</h4>
                  <p className="text-[#2d1f10]">📍 {event.location}</p>
                </div>
              )}
              {/* 参与人数：(已参加/上限) */}
              <div>
                <h4 className="text-xs mb-1" style={{ color: "#6b5740" }}>参与人数</h4>
                <p className="text-[#2d1f10]">
                  👥 {participantText} 人
                </p>
              </div>
            </div>

            {/* 活动描述 */}
            {event.description && (
              <div className="rounded-lg p-4 border"
                style={{ backgroundColor: "#ecdbb5", borderColor: "#3d2b1f" }}>
                <h4 className="text-sm font-medium mb-1" style={{ color: "#6b5740" }}>活动描述</h4>
                <p className="text-sm whitespace-pre-wrap" style={{ color: "#2d1f10" }}>
                  {event.description}
                </p>
              </div>
            )}

            {/* 组织者 */}
            <div>
              <h4 className="text-xs mb-1" style={{ color: "#6b5740" }}>组织者</h4>
              <p className="text-sm" style={{ color: "#2d1f10" }}>{event.organizerName || "未知"}</p>
            </div>

            {/* 操作按钮：进行中活动才显示，已结束活动不显示任何操作按钮 */}
            {event.status !== "completed" && event.status !== "cancelled" && (
              canManage ? (
                <div className="flex gap-3 pt-3 border-t"
                  style={{ borderColor: "#3d2b1f" }}>
                  <button
                    onClick={() => onEdit(event)}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{ backgroundColor: "rgba(185, 76, 0, 0.1)", color: "#b94c00" }}
                  >
                    ✏️ 编辑活动
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 pt-3 border-t"
                  style={{ borderColor: "#3d2b1f" }}>
                  <button
                    onClick={handleJoinClick}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-green-600 text-white hover:bg-green-700"
                  >
                    ➕ 加入活动
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </Modal>

      {/* 加入活动二次确认弹窗（羊皮纸风格） */}
      <Modal
        isOpen={showJoinConfirm}
        onClose={() => setShowJoinConfirm(false)}
        title="加入活动确认"
        size="sm"
        containerStyle={{ backgroundColor: "#f2e2c1" }}
        titleStyle={{ color: "#2d1f10" }}
      >
        {event && (
          <div className="space-y-4">
            <div className="rounded-lg p-4 text-center border"
              style={{ backgroundColor: "#ecdbb5", borderColor: "#3d2b1f" }}>
              <p className="text-sm font-medium" style={{ color: "#2d1f10" }}>
                确定要加入活动「{event.name}」吗？
              </p>
              <p className="text-xs mt-2" style={{ color: "#6b5740" }}>
                📅 {formatDate(event.startTime)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border"
                style={{ color: "#6b5740", borderColor: "#3d2b1f", backgroundColor: "#f2e2c1" }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmJoin}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-green-600 text-white hover:bg-green-700"
              >
                确认加入
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}