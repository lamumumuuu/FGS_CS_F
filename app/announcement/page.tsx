"use client";

import { useState, useEffect } from "react";
import { usePermission } from "@/contexts/PermissionContext";
import { request } from "@/app/api/client/core/request";
import { announcementApi, eventApi } from "@/app/api/client";
import { AFFAIR_PERMISSIONS } from "@/types/permissions";
import Modal from "@/components/Modal";
import type { Announcement, CreateAnnouncementRequest } from "@/app/api/client/modules/announcement";
import type { Event, CreateEventRequest } from "@/app/api/client/modules/event";

type TabType = "announcement" | "event";
type AnnouncementFilter = "all" | "global" | "peak";
type EventFilter = "all" | "ongoing" | "planned" | "completed";

const STATUS_MAP: Record<Event["status"], { label: string; color: string }> = {
  planned: { label: "已规划", color: "#d97706" },
  ongoing: { label: "进行中", color: "#059669" },
  completed: { label: "已结束", color: "#6b7280" },
  cancelled: { label: "已取消", color: "#9ca3af" },
};

const PEAK_NAMES: Record<number, string> = {
  1: "项目峰",
  2: "算法峰",
  3: "电路峰",
  4: "管理台",
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AnnouncementPage() {
  const { hasPermission, peakIds, user } = usePermission();

  const [activeTab, setActiveTab] = useState<TabType>("announcement");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementFilter, setAnnouncementFilter] = useState<AnnouncementFilter>("all");

  const [events, setEvents] = useState<Event[]>([]);
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);

  const [announcementForm, setAnnouncementForm] = useState<CreateAnnouncementRequest>({
    title: "",
    content: "",
    type: "global",
  });
  const [eventForm, setEventForm] = useState<CreateEventRequest>({
    name: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    maxParticipants: 50,
    type: "global",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canAnnounceGlobal = hasPermission(AFFAIR_PERMISSIONS.ANNOUNCE_GLOBAL);
  const canAnnouncePeak = hasPermission(AFFAIR_PERMISSIONS.ANNOUNCE_PEAK);
  const canCreateEvent = hasPermission(AFFAIR_PERMISSIONS.CREATE_EVENT);
  const canManageAllEvents = hasPermission(AFFAIR_PERMISSIONS.MANAGE_ALL_EVENTS);
  const canManageOwnPeak = hasPermission(AFFAIR_PERMISSIONS.MANAGE_OWN_PEAK);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [annData, evtData] = await Promise.all([
        announcementApi.getPublished(),
        eventApi.getActive(),
      ]);
      setAnnouncements(annData);
      setEvents(evtData);
    } catch (error) {
      console.error("加载数据失败:", error);
      showToast("数据加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAnnouncements = announcements.filter((a) => {
    if (announcementFilter === "all") return true;
    return a.type === announcementFilter;
  });

  const filteredEvents = events.filter((e) => {
    if (eventFilter === "all") return true;
    return e.status === eventFilter;
  });

  const handleOpenAnnouncementModal = () => {
    setAnnouncementForm({ title: "", content: "", type: canAnnounceGlobal ? "global" : "peak" });
    setFormError("");
    setShowAnnouncementModal(true);
  };

  const handleOpenEventModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        name: event.name,
        description: event.description || "",
        location: event.location || "",
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        maxParticipants: event.maxParticipants || 50,
        type: event.type,
      });
    } else {
      setEditingEvent(null);
      setEventForm({ name: "", description: "", location: "", startTime: "", endTime: "", maxParticipants: 50, type: "global" });
    }
    setFormError("");
    setShowEventModal(true);
  };

  const handleAnnouncementSubmit = async () => {
    if (!announcementForm.title.trim()) {
      setFormError("标题不能为空");
      return;
    }
    if (!announcementForm.content.trim()) {
      setFormError("内容不能为空");
      return;
    }
    if (announcementForm.type === "peak" && peakIds.length === 0) {
      setFormError("您尚未加入任何峰，无法发布本峰公告");
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateAnnouncementRequest = {
        title: announcementForm.title,
        content: announcementForm.content,
        type: announcementForm.type,
      };
      if (announcementForm.type === "peak" && peakIds.length > 0) {
        payload.peakId = peakIds[0];
      }
      await announcementApi.create(payload);
      showToast("公告发布成功", "success");
      setShowAnnouncementModal(false);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEventSubmit = async () => {
    if (!eventForm.name.trim()) {
      setFormError("活动名称不能为空");
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateEventRequest = {
        name: eventForm.name,
        description: eventForm.description,
        location: eventForm.location,
        startTime: eventForm.startTime,
        endTime: eventForm.endTime,
        maxParticipants: eventForm.maxParticipants,
        type: eventForm.type,
      };
      if (eventForm.type === "peak" && peakIds.length > 0) {
        payload.peakId = peakIds[0];
      }
      if (editingEvent) {
        await eventApi.update(editingEvent.id, payload);
        showToast("活动更新成功", "success");
      } else {
        await eventApi.create(payload);
        showToast("活动创建成功", "success");
      }
      setShowEventModal(false);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndEvent = async (event: Event) => {
    if (!canManageAllEvents && !(canManageOwnPeak && event.peakId && peakIds.includes(event.peakId))) {
      showToast("您没有权限管理此活动", "error");
      return;
    }
    if (!confirm(`确定要结束活动「${event.name}」吗？`)) return;
    try {
      await request<void>(`/events/${event.id}/end`, { method: "PUT" }, true);
      showToast("活动已结束", "success");
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "操作失败", "error");
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    if (!canManageAllEvents && !(canManageOwnPeak && event.peakId && peakIds.includes(event.peakId))) {
      showToast("您没有权限删除此活动", "error");
      return;
    }
    if (!confirm(`确定要删除活动「${event.name}」吗？此操作不可撤销。`)) return;
    try {
      await eventApi.delete(event.id);
      showToast("活动已删除", "success");
      if (viewingEvent?.id === event.id) setViewingEvent(null);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "删除失败", "error");
    }
  };

  const canManageEvent = (event: Event) => {
    if (canManageAllEvents) return true;
    if (canManageOwnPeak && event.peakId && peakIds.includes(event.peakId)) return true;
    return false;
  };

  const statusOrder: Event["status"][] = ["ongoing", "planned", "completed"];

  if (loading) {
    return (
      <div
        className="flex-1 flex items-center justify-center min-h-[calc(100vh-72px)]"
        style={{ backgroundColor: "#93c1a8" }}
      >
        <div className="text-xl font-shan" style={{ color: "#1a4a3a" }}>加载中...</div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-72px)]"
      style={{
        background: "radial-gradient(ellipse at 30% 35%, #291b0f 0%, #1d140b 70%)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* 页头（与任务大厅一致的居中书页样式） */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3 drop-shadow-lg font-shan" style={{ color: "#d4a574" }}>
            公告栏
          </h1>
          <p className="text-medium font-shan" style={{ color: "#a07848" }}>
            查看宗门公告与活动资讯
          </p>
        </div>

        {/* 筛选和操作栏（统一与任务大厅一致的深褐色卡片） */}
        <div
          className="rounded-lg shadow-md p-5 mb-6"
          style={{ backgroundColor: "#2b1e10", border: "1px solid #332418" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex gap-2 flex-wrap">
              {/* Tab 切换 */}
              {[
                { key: "announcement" as TabType, label: "公告页面" },
                { key: "event" as TabType, label: "活动页面" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all font-shan"
                  style={{
                    backgroundColor: activeTab === tab.key ? "#b94c00" : "transparent",
                    color: activeTab === tab.key ? "#f0e6c8" : "#a07850",
                    border: activeTab === tab.key ? "1px solid #b94c00" : "1px solid #332418",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {(activeTab === "announcement" && (canAnnounceGlobal || canAnnouncePeak)) ||
              (activeTab === "event" && canCreateEvent) ? (
              <button
                onClick={
                  activeTab === "announcement"
                    ? handleOpenAnnouncementModal
                    : () => handleOpenEventModal()
                }
                className="px-5 py-2.5 font-medium text-[#f0e6c8] rounded-lg hover:opacity-90 transition-all whitespace-nowrap font-shan"
                style={{ backgroundColor: "#b94c00" }}
              >
                {activeTab === "announcement" ? "+ 发布公告" : "+ 创建活动"}
              </button>
            ) : null}
          </div>

          {/* 筛选条件 */}
          <div className="mt-4 pt-4 border-t border-[#332418]">
            {activeTab === "announcement" ? (
              <div className="flex gap-2">
                {([
                  { key: "all" as AnnouncementFilter, label: "全部" },
                  { key: "global" as AnnouncementFilter, label: "宗门公告" },
                  { key: "peak" as AnnouncementFilter, label: "本峰公告" },
                ]).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setAnnouncementFilter(f.key)}
                    className="px-3 py-1.5 rounded text-xs font-medium transition-all font-shan"
                    style={{
                      backgroundColor: announcementFilter === f.key ? "#332418" : "#1a120b",
                      color: announcementFilter === f.key ? "#f0e6c8" : "#6b5740",
                      border: "1px solid #332418",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                {([
                  { key: "all" as EventFilter, label: "全部" },
                  { key: "ongoing" as EventFilter, label: "进行中" },
                  { key: "planned" as EventFilter, label: "已规划" },
                  { key: "completed" as EventFilter, label: "已结束" },
                ]).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setEventFilter(f.key)}
                    className="px-3 py-1.5 rounded text-xs font-medium transition-all font-shan"
                    style={{
                      backgroundColor: eventFilter === f.key ? "#332418" : "#1a120b",
                      color: eventFilter === f.key ? "#f0e6c8" : "#6b5740",
                      border: "1px solid #332418",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 公告列表 */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div
              className="text-center py-16 rounded-xl font-shan"
              style={{
                backgroundColor: "#2b1e10",
                border: "1px solid #332418",
                color: "#a07848",
              }}
            >
              暂无公告
            </div>
          ) : (
            filteredAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="rounded-xl p-5 transition-all hover:shadow-lg"
                style={{
                  backgroundColor: "#2b1e10",
                  border: "1px solid #332418",
                }}
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
                        {ann.type === "global" ? "宗门" : `本峰${ann.peakId ? `(${PEAK_NAMES[ann.peakId] || ""})` : ""}`}
                      </span>
                      <h3 className="text-lg font-bold font-shan" style={{ color: "#f0e6c8" }}>
                        {ann.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#d0b890" }}>
                      {ann.content}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid #332418" }}>
                  <span className="text-xs" style={{ color: "#8a7456" }}>
                    发布者：{ann.publisherName || "未知"}
                  </span>
                  <span className="text-xs" style={{ color: "#8a7456" }}>
                    {formatDate(ann.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 活动页面 */}
        {activeTab === "event" && (
          <div className="space-y-4">
            {/* 活动列表（统一与公告一致的深褐色卡片样式） */}
            {filteredEvents.length === 0 ? (
              <div
                className="text-center py-16 rounded-xl font-shan"
                style={{
                  backgroundColor: "#2b1e10",
                  border: "1px solid #332418",
                  color: "#a07848",
                }}
              >
                暂无活动
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const status = STATUS_MAP[evt.status];
                const manageable = canManageEvent(evt);
                return (
                  <div
                    key={evt.id}
                    className="rounded-xl p-5 transition-all hover:shadow-lg"
                    style={{
                      backgroundColor: "#2b1e10",
                      border: "1px solid #332418",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 cursor-pointer" onClick={() => setViewingEvent(evt)}>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium font-shan"
                            style={{
                              backgroundColor: status.color + "22",
                              color: status.color,
                            }}
                          >
                            {status.label}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium font-shan"
                            style={{
                              backgroundColor: evt.type === "global" ? "rgba(212, 165, 116, 0.15)" : "rgba(185, 76, 0, 0.15)",
                              color: evt.type === "global" ? "#d4a574" : "#f0a060",
                            }}
                          >
                            {evt.type === "global" ? "宗门" : `本峰${evt.peakId ? `(${PEAK_NAMES[evt.peakId] || ""})` : ""}`}
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
                      {manageable && (
                        <div className="flex flex-col gap-2 ml-2 flex-shrink-0">
                          {evt.status === "ongoing" && (
                            <button
                              onClick={() => handleEndEvent(evt)}
                              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all font-shan"
                              style={{
                                backgroundColor: "rgba(217, 119, 6, 0.2)",
                                color: "#f0a060",
                                border: "1px solid rgba(217, 119, 6, 0.3)",
                              }}
                            >
                              结束活动
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEventModal(evt)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all font-shan"
                            style={{
                              backgroundColor: "rgba(212, 165, 116, 0.1)",
                              color: "#d4a574",
                              border: "1px solid rgba(212, 165, 116, 0.2)",
                            }}
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all font-shan"
                            style={{
                              backgroundColor: "rgba(220, 38, 38, 0.1)",
                              color: "#f87171",
                              border: "1px solid rgba(220, 38, 38, 0.2)",
                            }}
                          >
                            删除
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
              })
            )}
          </div>
        )}
      </div>

      {/* 发布公告弹窗（参考任务大厅-发布悬赏设计风格） */}
      <Modal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        title="发布公告"
      >
        <div className="space-y-5">
          {formError && (
            <div className="text-red-600 text-sm px-3 py-2 bg-red-50 rounded-lg">
              {formError}
            </div>
          )}

          {/* 发布者信息卡片（参考任务大厅-发布悬赏的发布者信息卡片） */}
          <div
            className="rounded-lg p-4"
            style={{
              backgroundColor: "rgba(185, 76, 0, 0.06)",
              border: "1px solid rgba(185, 76, 0, 0.15)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl border"
                  style={{ backgroundColor: "#fff", borderColor: "rgba(185, 76, 0, 0.2)" }}
                >
                  👤
                </div>
                <div>
                  <div className="font-bold text-gray-800">{user?.username || "未知"}</div>
                  <div className="text-xs text-gray-500">发布者</div>
                </div>
              </div>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                style={{
                  backgroundColor: "rgba(217, 119, 6, 0.1)",
                  border: "1px solid rgba(217, 119, 6, 0.2)",
                }}
              >
                <span className="text-lg">💎</span>
                <span className="text-lg font-bold text-amber-700">
                  {(user?.lingshi ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 公告范围选择（参考发布悬赏的范围选择样式） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              公告范围 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {canAnnouncePeak && (
                <label
                  className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${announcementForm.type === "peak" ? "border-amber-500 bg-amber-50" : "border-gray-300 hover:border-gray-400"}`}
                >
                  <input
                    type="radio"
                    name="announcementType"
                    value="peak"
                    checked={announcementForm.type === "peak"}
                    onChange={() => setAnnouncementForm({ ...announcementForm, type: "peak" })}
                    className="accent-amber-600"
                  />
                  <span className="text-sm font-medium">本峰公告</span>
                </label>
              )}
              {canAnnounceGlobal && (
                <label
                  className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${announcementForm.type === "global" ? "border-amber-500 bg-amber-100" : "border-gray-300 hover:border-gray-400"}`}
                >
                  <input
                    type="radio"
                    name="announcementType"
                    value="global"
                    checked={announcementForm.type === "global"}
                    onChange={() => setAnnouncementForm({ ...announcementForm, type: "global" })}
                    className="accent-amber-600"
                  />
                  <span className="text-sm font-medium">宗门公告</span>
                </label>
              )}
            </div>
          </div>

          {/* 公告标题（带行内校验，参考发布悬赏的校验样式） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公告标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              placeholder="请输入公告标题..."
              className={`w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm ${announcementForm.title && announcementForm.title.trim().length < 2 ? "border-red-400" : "border-gray-300"}`}
              maxLength={100}
            />
            <div className="flex items-center justify-between mt-1">
              {announcementForm.title && announcementForm.title.trim().length < 2 ? (
                <p className="text-sm text-red-500">标题至少2个字符</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-gray-400">{announcementForm.title.length}/100</span>
            </div>
          </div>

          {/* 公告内容（带行内校验和字数统计） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公告内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
              rows={5}
              placeholder="请详细描述公告内容..."
              className={`w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none ${announcementForm.content && announcementForm.content.trim().length < 5 ? "border-red-400" : "border-gray-300"}`}
            />
            <div className="flex items-center justify-between mt-1">
              {announcementForm.content && announcementForm.content.trim().length < 5 ? (
                <p className="text-sm text-red-500">内容至少5个字符</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-gray-400">{announcementForm.content.length} 字</span>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <p>💡 公告发布后将立即对目标范围用户可见</p>
            <p className="mt-1">💡 宗门公告面向全体成员，本峰公告仅面向所属峰成员</p>
          </div>

          {/* 取消 / 确认按钮（参考发布悬赏的按钮样式） */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAnnouncementModal(false)}
              className="flex-1 px-4 py-2.5 border text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              style={{ borderColor: "rgba(185, 76, 0, 0.3)" }}
            >
              取消
            </button>
            <button
              onClick={handleAnnouncementSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all font-medium disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #b94c00 0%, #d97706 100%)" }}
            >
              {submitting ? "发布中..." : "📜 发布公告"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 创建/编辑活动弹窗 */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={editingEvent ? "编辑活动" : "创建活动"}
      >
        <div className="space-y-4">
          {formError && (
            <div className="text-red-600 text-sm px-3 py-2 bg-red-50 rounded-lg">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              活动名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={eventForm.name}
              onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
              placeholder="请输入活动名称"
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              style={{ borderColor: "rgba(185, 76, 0, 0.2)" }}
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              活动描述
            </label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              rows={3}
              placeholder="请输入活动描述..."
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none"
              style={{ borderColor: "rgba(185, 76, 0, 0.2)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              活动地点
            </label>
            <input
              type="text"
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              placeholder="请输入活动地点"
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              style={{ borderColor: "rgba(185, 76, 0, 0.2)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始时间
              </label>
              <input
                type="datetime-local"
                value={eventForm.startTime}
                onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                style={{ borderColor: "rgba(185, 76, 0, 0.2)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                结束时间
              </label>
              <input
                type="datetime-local"
                value={eventForm.endTime}
                onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                style={{ borderColor: "rgba(185, 76, 0, 0.2)" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              参与人数上限
            </label>
            <input
              type="number"
              min={1}
              value={eventForm.maxParticipants}
              onChange={(e) => setEventForm({ ...eventForm, maxParticipants: parseInt(e.target.value) || 50 })}
              className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              style={{ borderColor: "rgba(185, 76, 0, 0.2)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              类型
            </label>
            <div className="flex gap-3">
              {canCreateEvent && (
                <button
                  onClick={() => setEventForm({ ...eventForm, type: "global" })}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: eventForm.type === "global" ? "#b94c00" : "rgba(255,255,255,0.5)",
                    color: eventForm.type === "global" ? "#fff" : "#6b5740",
                    border: eventForm.type === "global" ? "none" : "1px solid rgba(185, 76, 0, 0.2)",
                  }}
                >
                  宗门活动
                </button>
              )}
              {(canManageOwnPeak || canManageAllEvents) && (
                <button
                  onClick={() => setEventForm({ ...eventForm, type: "peak" })}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: eventForm.type === "peak" ? "#d97706" : "rgba(255,255,255,0.5)",
                    color: eventForm.type === "peak" ? "#fff" : "#6b5740",
                    border: eventForm.type === "peak" ? "none" : "1px solid rgba(217,119,6,0.2)",
                  }}
                >
                  本峰活动
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowEventModal(false)}
              className="flex-1 px-4 py-2.5 border text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              style={{ borderColor: "rgba(185, 76, 0, 0.3)" }}
            >
              取消
            </button>
            <button
              onClick={handleEventSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all font-medium disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #b94c00 0%, #d97706 100%)" }}
            >
              {submitting ? (editingEvent ? "更新中..." : "创建中...") : (editingEvent ? "保存修改" : "创建活动")}
            </button>
          </div>
        </div>
      </Modal>

      {/* 活动详情弹窗 */}
      <Modal
        isOpen={viewingEvent !== null}
        onClose={() => setViewingEvent(null)}
        title={viewingEvent?.name || ""}
      >
        {viewingEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: STATUS_MAP[viewingEvent.status].color + "22",
                  color: STATUS_MAP[viewingEvent.status].color,
                }}
              >
                {STATUS_MAP[viewingEvent.status].label}
              </span>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: viewingEvent.type === "global" ? "rgba(185, 76, 0, 0.15)" : "rgba(217, 119, 6, 0.15)",
                  color: viewingEvent.type === "global" ? "#b94c00" : "#92400e",
                }}
              >
                {viewingEvent.type === "global" ? "宗门活动" : `本峰活动${viewingEvent.peakId ? `(${PEAK_NAMES[viewingEvent.peakId] || ""})` : ""}`}
              </span>
            </div>
            {viewingEvent.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">活动描述</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingEvent.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {viewingEvent.location && (
                <div>
                  <h4 className="text-xs text-gray-500 mb-1">活动地点</h4>
                  <p className="text-gray-700">📍 {viewingEvent.location}</p>
                </div>
              )}
              {viewingEvent.startTime && (
                <div>
                  <h4 className="text-xs text-gray-500 mb-1">开始时间</h4>
                  <p className="text-gray-700">🕐 {formatDate(viewingEvent.startTime)}</p>
                </div>
              )}
              {viewingEvent.endTime && (
                <div>
                  <h4 className="text-xs text-gray-500 mb-1">结束时间</h4>
                  <p className="text-gray-700">🕐 {formatDate(viewingEvent.endTime)}</p>
                </div>
              )}
              {viewingEvent.maxParticipants != null && (
                <div>
                  <h4 className="text-xs text-gray-500 mb-1">参与人数</h4>
                  <p className="text-gray-700">👥 限额 {viewingEvent.maxParticipants} 人</p>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-xs text-gray-500 mb-1">组织者</h4>
              <p className="text-sm text-gray-700">{viewingEvent.organizerName || "未知"}</p>
            </div>
            {canManageEvent(viewingEvent) && (
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                {viewingEvent.status === "ongoing" && (
                  <button
                    onClick={() => handleEndEvent(viewingEvent)}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{ backgroundColor: "rgba(217, 119, 6, 0.15)", color: "#92400e" }}
                  >
                    结束活动
                  </button>
                )}
                <button
                  onClick={() => {
                    handleOpenEventModal(viewingEvent);
                    setViewingEvent(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ backgroundColor: "rgba(185, 76, 0, 0.1)", color: "#b94c00" }}
                >
                  编辑活动
                </button>
                <button
                  onClick={() => handleDeleteEvent(viewingEvent)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#991b1b" }}
                >
                  删除活动
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Toast 提示 */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white font-medium z-50 font-shan ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
          style={{
            backdropFilter: "blur(8px)",
            boxShadow: toast.type === "success"
              ? "0 10px 25px -5px rgba(16, 185, 129, 0.4)"
              : "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}