// app/announcement/hooks/useAnnouncement.ts

/**
 * 公告栏页面自定义 Hook
 * 
 * 封装公告和活动的所有数据管理、CRUD操作、弹窗状态和权限控制逻辑。
 * 将主页面约680行的代码拆分为可维护的Hook，让页面组件专注于布局和渲染。
 * 
 * 功能：
 * 1. 加载公告和活动数据
 * 2. 公告的创建、编辑、删除
 * 3. 活动的创建、编辑、删除、结束、加入
 * 4. 弹窗状态管理（发布弹窗、详情弹窗）
 * 5. 表单状态管理
 * 6. 权限判断
 * 7. Toast提示
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePermission } from "@/contexts/PermissionContext";
import { announcementApi, eventApi, rbacApi } from "@/app/api/client";
import { AFFAIR_PERMISSIONS } from "@/types/permissions";
import type { Announcement, CreateAnnouncementRequest } from "@/app/api/client/modules/announcement";
import type { Event, CreateEventRequest } from "@/app/api/client/modules/event";
import { getDefaultStartTime } from "../components/constants";

// =====================================================================
// 类型定义
// =====================================================================

export type TabType = "announcement" | "event";
export type AnnouncementFilter = "all" | "global" | "peak";
export type EventFilter = "all" | "peak" | "completed";

// =====================================================================
// Hook 返回值类型
// =====================================================================

interface UseAnnouncementReturn {
  // ---- Tab 和筛选 ----
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  announcementFilter: AnnouncementFilter;
  setAnnouncementFilter: (filter: AnnouncementFilter) => void;
  eventFilter: EventFilter;
  setEventFilter: (filter: EventFilter) => void;

  // ---- 数据 ----
  announcements: Announcement[];
  events: Event[];
  peaks: { id: number; name: string }[];
  loading: boolean;
  filteredAnnouncements: Announcement[];
  filteredEvents: Event[];

  // ---- 弹窗状态 ----
  showAnnouncementModal: boolean;
  showEventModal: boolean;
  viewingEvent: Event | null;
  viewingAnnouncement: Announcement | null;
  editingEvent: Event | null;
  editingAnnouncement: Announcement | null;

  // ---- 表单状态 ----
  announcementForm: CreateAnnouncementRequest;
  eventForm: CreateEventRequest;
  maxParticipantsEnabled: boolean;
  formError: string;
  submitting: boolean;

  // ---- 权限 ----
  canAnnounceGlobal: boolean;
  canAnnouncePeak: boolean;
  canCreateEvent: boolean;
  canManageAllEvents: boolean;
  canManageOwnPeak: boolean;
  canEditAnnouncement: boolean;
  canManageEvent: (event: Event) => boolean;

  // ---- 工具函数 ----
  getPeakName: (peakId?: number | null) => string;
  roleDisplayNames: string[];
  peakDisplayNames: string[];

  // ---- 操作方法 ----
  loadData: () => Promise<void>;
  refresh: () => Promise<void>;
  handleOpenAnnouncementModal: (ann?: Announcement) => void;
  handleOpenEventModal: (event?: Event) => void;
  handleAnnouncementSubmit: () => Promise<void>;
  handleEventSubmit: () => Promise<void>;
  handleDeleteAnnouncement: (ann: Announcement) => Promise<void>;
  handleDeleteEvent: (event: Event) => Promise<void>;
  handleEndEvent: (event: Event) => Promise<void>;
  handleJoinEvent: (event: Event) => Promise<void>;
  handleToggleMaxParticipants: () => void;
  setAnnouncementForm: (form: CreateAnnouncementRequest) => void;
  setEventForm: (form: CreateEventRequest) => void;
  setViewingEvent: (event: Event | null) => void;
  setViewingAnnouncement: (ann: Announcement | null) => void;
  setShowAnnouncementModal: (show: boolean) => void;
  setShowEventModal: (show: boolean) => void;
  setEditingAnnouncement: (ann: Announcement | null) => void;
  setEditingEvent: (event: Event | null) => void;
  setFormError: (error: string) => void;

  // ---- Toast ----
  toast: { message: string; type: "success" | "error" } | null;
  showToast: (message: string, type: "success" | "error") => void;
}

// =====================================================================
// Hook 实现
// =====================================================================

export function useAnnouncement(): UseAnnouncementReturn {
  // ✅ 修复：移除未使用的 user
  const { hasPermission, peakIds, roles } = usePermission();

  // ---- Tab 状态 ----
  const [activeTab, setActiveTab] = useState<TabType>("announcement");
  const [announcementFilter, setAnnouncementFilter] = useState<AnnouncementFilter>("all");
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");

  // ---- 数据状态 ----
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [peaks, setPeaks] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- 弹窗状态 ----
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // ---- 表单状态 ----
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
    maxParticipants: undefined,
    type: "global",
  });
  const [maxParticipantsEnabled, setMaxParticipantsEnabled] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ---- Toast 状态 ----
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ---- 权限计算 ----
  const canAnnounceGlobal = hasPermission(AFFAIR_PERMISSIONS.ANNOUNCE_GLOBAL);
  const canAnnouncePeak = hasPermission(AFFAIR_PERMISSIONS.ANNOUNCE_PEAK);
  const canCreateEvent = hasPermission(AFFAIR_PERMISSIONS.CREATE_EVENT);
  const canManageAllEvents = hasPermission(AFFAIR_PERMISSIONS.MANAGE_ALL_EVENTS);
  const canManageOwnPeak = hasPermission(AFFAIR_PERMISSIONS.MANAGE_OWN_PEAK);
  const canEditAnnouncement = canAnnounceGlobal || canAnnouncePeak;

  // ---- 工具函数 ----
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const getPeakName = useCallback(
    (peakId?: number | null) => {
      if (!peakId) return "";
      const peak = peaks.find((p) => p.id === peakId);
      return peak?.name || "";
    },
    [peaks]
  );

  const roleDisplayNames = useMemo(
    () => roles.map((r) => r.displayName).filter(Boolean),
    [roles]
  );

  const peakDisplayNames = useMemo(
    () => peakIds.map((id) => getPeakName(id)).filter(Boolean),
    [peakIds, getPeakName]
  );

  // ---- 数据加载 ----
  const loadData = useCallback(async () => {
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
  }, [showToast]);

  // ---- 初始化加载峰列表和业务数据 ----
  useEffect(() => {
    // ✅ 修复：添加 eslint-disable 注释，因为这是合法的初始化数据获取
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    rbacApi
      .getAllPeaks()
      .then((data) => {
        setPeaks((data || []).map((p) => ({ id: Number(p.id), name: p.name })));
      })
      .catch((err) => {
        console.error("加载峰列表失败:", err);
      });
  }, [loadData]);

  // ---- 筛选数据 ----
  const filteredAnnouncements = announcements.filter((a) => {
    if (announcementFilter === "all") return true;
    return a.type === announcementFilter;
  });

  const filteredEvents = events.filter((e) => {
    if (eventFilter === "all") return true;
    if (eventFilter === "peak") return e.peakId != null && peakIds.includes(e.peakId);
    return e.status === "completed" || e.status === "cancelled";
  });

  // ---- 权限判断函数 ----
  const canManageEvent = useCallback(
    (event: Event) => {
      if (canManageAllEvents) return true;
      if (canManageOwnPeak && event.peakId && peakIds.includes(event.peakId)) return true;
      return false;
    },
    [canManageAllEvents, canManageOwnPeak, peakIds]
  );

  // ---- 打开公告弹窗 ----
  const handleOpenAnnouncementModal = useCallback(
    (ann?: Announcement) => {
      if (ann) {
        setEditingAnnouncement(ann);
        setAnnouncementForm({
          title: ann.title,
          content: ann.content,
          type: ann.type,
          peakId: ann.peakId ?? undefined,
        });
      } else {
        setEditingAnnouncement(null);
        setAnnouncementForm({
          title: "",
          content: "",
          type: canAnnounceGlobal ? "global" : "peak",
        });
      }
      setFormError("");
      setShowAnnouncementModal(true);
    },
    [canAnnounceGlobal]
  );

  // ---- 打开活动弹窗 ----
  const handleOpenEventModal = useCallback(
    (event?: Event) => {
      if (event) {
        setEditingEvent(event);
        setEventForm({
          name: event.name,
          description: event.description || "",
          location: event.location || "",
          startTime: event.startTime || "",
          endTime: event.endTime || "",
          maxParticipants: event.maxParticipants,
          type: event.type,
        });
        setMaxParticipantsEnabled(event.maxParticipants != null && event.maxParticipants > 0);
      } else {
        setEditingEvent(null);
        setEventForm({
          name: "",
          description: "",
          location: "",
          startTime: getDefaultStartTime(),
          endTime: "",
          maxParticipants: undefined,
          type: "global",
        });
        setMaxParticipantsEnabled(false);
      }
      setFormError("");
      setShowEventModal(true);
    },
    []
  );

  // ---- 参与人数开关切换 ----
  const handleToggleMaxParticipants = useCallback(() => {
    setMaxParticipantsEnabled((prev) => {
      const next = !prev;
      if (next && eventForm.maxParticipants == null) {
        setEventForm((f) => ({ ...f, maxParticipants: 50 }));
      }
      if (!next) {
        setEventForm((f) => ({ ...f, maxParticipants: undefined }));
      }
      return next;
    });
  }, [eventForm.maxParticipants]);

  // ---- 提交公告 ----
  const handleAnnouncementSubmit = useCallback(async () => {
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
      if (editingAnnouncement) {
        await announcementApi.update(editingAnnouncement.id, payload);
        showToast("公告更新成功", "success");
      } else {
        await announcementApi.create(payload);
        showToast("公告发布成功", "success");
      }
      setShowAnnouncementModal(false);
      setEditingAnnouncement(null);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setSubmitting(false);
    }
  }, [announcementForm, editingAnnouncement, peakIds, loadData, showToast]);

  // ---- 提交活动 ----
  const handleEventSubmit = useCallback(async () => {
    if (!eventForm.name.trim()) {
      setFormError("活动名称不能为空");
      return;
    }
    if (!eventForm.startTime) {
      setFormError("开始时间不能为空");
      return;
    }
    if (eventForm.endTime) {
      const start = new Date(eventForm.startTime).getTime();
      const end = new Date(eventForm.endTime).getTime();
      if (isNaN(start) || isNaN(end)) {
        setFormError("时间格式无效");
        return;
      }
      const diffMs = end - start;
      if (diffMs < 60 * 60 * 1000) {
        setFormError("活动总时长不得少于1小时");
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload: CreateEventRequest = {
        name: eventForm.name,
        description: eventForm.description,
        location: eventForm.location,
        startTime: eventForm.startTime,
        endTime: eventForm.endTime || undefined,
        maxParticipants: maxParticipantsEnabled ? eventForm.maxParticipants : undefined,
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
  }, [eventForm, editingEvent, peakIds, maxParticipantsEnabled, loadData, showToast]);

  // ---- 删除公告 ----
  const handleDeleteAnnouncement = useCallback(
    async (ann: Announcement) => {
      if (!canEditAnnouncement) {
        showToast("您没有权限删除公告", "error");
        return;
      }
      try {
        await announcementApi.delete(ann.id);
        showToast("公告已删除", "success");
        setShowAnnouncementModal(false);
        setEditingAnnouncement(null);
        if (viewingAnnouncement?.id === ann.id) setViewingAnnouncement(null);
        await loadData();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "删除失败", "error");
      }
    },
    [canEditAnnouncement, viewingAnnouncement, loadData, showToast]
  );

  // ---- 结束活动 ----
  const handleEndEvent = useCallback(
    async (event: Event) => {
      if (!canManageAllEvents && !(canManageOwnPeak && event.peakId && peakIds.includes(event.peakId))) {
        showToast("您没有权限管理此活动", "error");
        return;
      }
      if (!confirm(`确定要结束活动「${event.name}」吗？`)) return;
      try {
        await eventApi.end(event.id);
        showToast("活动已结束", "success");
        await loadData();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "操作失败", "error");
      }
    },
    [canManageAllEvents, canManageOwnPeak, peakIds, loadData, showToast]
  );

  // ---- 删除活动 ----
  const handleDeleteEvent = useCallback(
    async (event: Event) => {
      if (!canManageAllEvents && !(canManageOwnPeak && event.peakId && peakIds.includes(event.peakId))) {
        showToast("您没有权限删除此活动", "error");
        return;
      }
      if (!confirm(`确定要删除活动「${event.name}」吗？此操作不可撤销。`)) return;
      try {
        await eventApi.delete(event.id);
        showToast("活动已删除", "success");
        if (viewingEvent?.id === event.id) setViewingEvent(null);
        if (showEventModal) {
          setShowEventModal(false);
          setEditingEvent(null);
        }
        await loadData();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "删除失败", "error");
      }
    },
    [canManageAllEvents, canManageOwnPeak, peakIds, viewingEvent, showEventModal, loadData, showToast]
  );

  // ---- 加入活动 ----
  const handleJoinEvent = useCallback(
    async (event: Event) => {
      try {
        await eventApi.join(event.id);
        showToast("加入活动成功", "success");
        setViewingEvent(null);
        await loadData();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "加入失败", "error");
      }
    },
    [loadData, showToast]
  );

  // ---- 刷新（别名） ----
  const refresh = loadData;

  // ---- 返回值 ----
  return {
    // Tab 和筛选
    activeTab,
    setActiveTab,
    announcementFilter,
    setAnnouncementFilter,
    eventFilter,
    setEventFilter,

    // 数据
    announcements,
    events,
    peaks,
    loading,
    filteredAnnouncements,
    filteredEvents,

    // 弹窗状态
    showAnnouncementModal,
    showEventModal,
    viewingEvent,
    viewingAnnouncement,
    editingEvent,
    editingAnnouncement,

    // 表单状态
    announcementForm,
    eventForm,
    maxParticipantsEnabled,
    formError,
    submitting,

    // 权限
    canAnnounceGlobal,
    canAnnouncePeak,
    canCreateEvent,
    canManageAllEvents,
    canManageOwnPeak,
    canEditAnnouncement,
    canManageEvent,

    // 工具函数
    getPeakName,
    roleDisplayNames,
    peakDisplayNames,

    // 操作方法
    loadData,
    refresh,
    handleOpenAnnouncementModal,
    handleOpenEventModal,
    handleAnnouncementSubmit,
    handleEventSubmit,
    handleDeleteAnnouncement,
    handleDeleteEvent,
    handleEndEvent,
    handleJoinEvent,
    handleToggleMaxParticipants,
    setAnnouncementForm,
    setEventForm,
    setViewingEvent,
    setViewingAnnouncement,
    setShowAnnouncementModal,
    setShowEventModal,
    setEditingAnnouncement,
    setEditingEvent,
    setFormError,

    // Toast
    toast,
    showToast,
  };
}