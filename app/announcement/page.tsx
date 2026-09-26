// app/announcement/page.tsx

/**
 * 公告栏页面
 *
 * 使用 useAnnouncement Hook 管理所有业务逻辑，页面组件专注于布局和渲染。
 * 组件拆分为：
 * - LoadingState         : 加载状态骨架屏
 * - FilterBar            : 筛选栏（Tab 切换 + 操作按钮 + 筛选条件）
 * - AnnouncementList     : 公告卡片列表
 * - EventList            : 活动卡片列表
 * - PublishAnnouncement  : 发布/编辑公告弹窗（独立）
 * - PublishEvent         : 创建/编辑活动弹窗（独立，横向三步式）
 * - EventDetailModal     : 活动详情弹窗
 * - AnnouncementModal    : 公告详情弹窗（基础弹窗组件）
 *
 * 所有数据均从后端数据库实时获取，通过 PermissionContext 统一管理。
 */

"use client";

import { useAnnouncement } from "./hooks/useAnnouncement";
import LoadingState from "./components/LoadingState";
import FilterBar from "./components/FilterBar";
import AnnouncementList from "./components/AnnouncementList";
import EventList from "./components/EventList";
import PublishAnnouncement from "./components/PublishAnnouncement";
import PublishEvent from "./components/PublishEvent";
import EventDetailModal from "./components/EventDetailModal";
import Modal from "@/components/Modal";
import { usePermission } from "@/contexts/PermissionContext";
import { formatDate } from "./components/constants";

export default function AnnouncementPage() {
  const hook = useAnnouncement();
  const { user } = usePermission();

  // 加载中展示骨架屏
  if (hook.loading) {
    return <LoadingState />;
  }

  return (
    <div
      className="flex-1 py-8 px-4 sm:px-6 lg:px-8 min-h-screen"
      style={{
        background: "radial-gradient(ellipse at 30% 35%, #291b0f 0%, #1d140b 70%)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* 页头 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3 drop-shadow-lg font-shan" style={{ color: "#d4a574" }}>
            公告栏
          </h1>
          <p className="text-medium font-shan" style={{ color: "#a07848" }}>
            查看宗门公告与活动资讯
          </p>
        </div>

        {/* 筛选栏 */}
        <FilterBar
          activeTab={hook.activeTab}
          onTabChange={hook.setActiveTab}
          announcementFilter={hook.announcementFilter}
          onAnnouncementFilterChange={hook.setAnnouncementFilter}
          eventFilter={hook.eventFilter}
          onEventFilterChange={hook.setEventFilter}
          canAnnounceGlobal={hook.canAnnounceGlobal}
          canAnnouncePeak={hook.canAnnouncePeak}
          canCreateEvent={hook.canCreateEvent}
          onPublishClick={() => hook.handleOpenAnnouncementModal()}
          onCreateEventClick={() => hook.handleOpenEventModal()}
        />

        {/* 公告列表 / 活动列表 */}
        {hook.activeTab === "announcement" ? (
          <AnnouncementList
            announcements={hook.filteredAnnouncements}
            onView={(a) => hook.setViewingAnnouncement(a)}
            onEdit={(a) => hook.handleOpenAnnouncementModal(a)}
            onDelete={(a) => hook.handleDeleteAnnouncement(a)}
            canEdit={hook.canEditAnnouncement}
            getPeakName={hook.getPeakName}
          />
        ) : (
          <EventList
            events={hook.filteredEvents}
            onView={(e) => hook.setViewingEvent(e)}
            onEdit={(e) => hook.handleOpenEventModal(e)}
            canManage={hook.canManageEvent}
            getPeakName={hook.getPeakName}
          />
        )}
      </div>

      {/* 发布/编辑公告弹窗（独立） */}
      <PublishAnnouncement
        isOpen={hook.showAnnouncementModal}
        form={hook.announcementForm}
        onFormChange={hook.setAnnouncementForm}
        onSubmit={hook.handleAnnouncementSubmit}
        onCancel={() => {
          hook.setShowAnnouncementModal(false);
          hook.setEditingAnnouncement(null);
        }}
        formError={hook.formError}
        submitting={hook.submitting}
        canAnnounceGlobal={hook.canAnnounceGlobal}
        canAnnouncePeak={hook.canAnnouncePeak}
        user={user}
        editingAnnouncement={hook.editingAnnouncement}
        roleDisplayNames={hook.roleDisplayNames}
        peakDisplayNames={hook.peakDisplayNames}
        onDelete={hook.handleDeleteAnnouncement}
      />

      {/* 创建/编辑活动弹窗（独立，横向三步式） */}
      <PublishEvent
        isOpen={hook.showEventModal}
        form={hook.eventForm}
        onFormChange={hook.setEventForm}
        onSubmit={hook.handleEventSubmit}
        onCancel={() => {
          hook.setShowEventModal(false);
          hook.setEditingEvent(null);
        }}
        formError={hook.formError}
        submitting={hook.submitting}
        editingEvent={hook.editingEvent}
        maxParticipantsEnabled={hook.maxParticipantsEnabled}
        onToggleMaxParticipants={hook.handleToggleMaxParticipants}
        canCreateEvent={hook.canCreateEvent}
        canManageOwnPeak={hook.canManageOwnPeak}
        canManageAllEvents={hook.canManageAllEvents}
        onDelete={hook.handleDeleteEvent}
        onEnd={hook.handleEndEvent}
      />

      {/* 活动详情弹窗 */}
      <EventDetailModal
        event={hook.viewingEvent}
        onClose={() => hook.setViewingEvent(null)}
        canManage={hook.viewingEvent ? hook.canManageEvent(hook.viewingEvent) : false}
        onEdit={(e) => {
          hook.handleOpenEventModal(e);
          hook.setViewingEvent(null);
        }}
        onJoin={(e) => hook.handleJoinEvent(e)}
        getPeakName={hook.getPeakName}
      />

      {/* 公告详情弹窗 */}
      <Modal
        isOpen={hook.viewingAnnouncement !== null}
        onClose={() => hook.setViewingAnnouncement(null)}
        title={hook.viewingAnnouncement?.title || "公告详情"}
        size="lg"
        containerStyle={{ backgroundColor: "#f2e2c1" }}
        titleStyle={{ color: "#2d1f10" }}
      >
        {hook.viewingAnnouncement && (
          <div className="space-y-4">
            {/* 类型标签 + 时间 */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-400">
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor:
                      hook.viewingAnnouncement.type === "global"
                        ? "rgba(185, 76, 0, 0.15)"
                        : "rgba(217, 119, 6, 0.15)",
                    color:
                      hook.viewingAnnouncement.type === "global" ? "#b94c00" : "#92400e",
                  }}
                >
                  {hook.viewingAnnouncement.type === "global"
                    ? "宗门公告"
                    : `本峰公告${hook.viewingAnnouncement.peakId ? `(${hook.getPeakName(hook.viewingAnnouncement.peakId)})` : ""}`}
                </span>
              </div>
              <span className="text-xs text-[#6b5740]">
                {formatDate(hook.viewingAnnouncement.createdAt)}
              </span>
            </div>

            {/* 发布者信息 */}
            <div className="text-sm text-[#6b5740]">
              发布者：{hook.viewingAnnouncement.publisherName || "未知"}
            </div>

            {/* 公告完整内容 */}
            <div className="bg-[#ecdbb5] rounded-lg p-4 border border-[#3d2b1f]">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#2d1f10]">
                {hook.viewingAnnouncement.content}
              </p>
            </div>

            {/* 编辑按钮（有权限时显示） */}
            {hook.canEditAnnouncement && (
              <div className="flex gap-3 pt-2 border-t border-gray-400">
                <button
                  onClick={() => {
                    const ann = hook.viewingAnnouncement;
                    hook.setViewingAnnouncement(null);
                    hook.handleOpenAnnouncementModal(ann ?? undefined);
                  }}
                  className="flex-1 px-4 py-2.5 text-white rounded-lg transition-all font-medium bg-amber-700 hover:bg-amber-800"
                >
                  编辑公告
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Toast 提示 */}
      {hook.toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white font-medium z-50 font-shan ${
            hook.toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
          style={{
            backdropFilter: "blur(8px)",
            boxShadow:
              hook.toast.type === "success"
                ? "0 10px 25px -5px rgba(16, 185, 129, 0.4)"
                : "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
          }}
        >
          {hook.toast.message}
        </div>
      )}
    </div>
  );
}