// app/announcement/components/FilterBar.tsx

/**
 * 筛选栏组件
 * 
 * 包含：
 * 1. Tab切换（公告页面 / 活动页面）
 * 2. 发布/创建操作按钮（带权限控制）
 * 3. 公告筛选条件（全部 / 宗门公告 / 本峰公告）
 * 4. 活动筛选条件（全部活动 / 本峰活动 / 已结束）
 * 
 * 职责：纯粹的UI展示和事件传递，不包含业务逻辑
 */

import type { TabType, AnnouncementFilter, EventFilter } from "../hooks/useAnnouncement";

interface FilterBarProps {
  // ---- Tab ----
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;

  // ---- 公告筛选 ----
  announcementFilter: AnnouncementFilter;
  onAnnouncementFilterChange: (filter: AnnouncementFilter) => void;

  // ---- 活动筛选 ----
  eventFilter: EventFilter;
  onEventFilterChange: (filter: EventFilter) => void;

  // ---- 权限 ----
  canAnnounceGlobal: boolean;
  canAnnouncePeak: boolean;
  canCreateEvent: boolean;

  // ---- 操作 ----
  onPublishClick: () => void;
  onCreateEventClick: () => void;
}

export default function FilterBar({
  activeTab,
  onTabChange,
  announcementFilter,
  onAnnouncementFilterChange,
  eventFilter,
  onEventFilterChange,
  canAnnounceGlobal,
  canAnnouncePeak,
  canCreateEvent,
  onPublishClick,
  onCreateEventClick,
}: FilterBarProps) {
  // 判断是否显示发布/创建按钮
  const showPublishButton =
    activeTab === "announcement" && (canAnnounceGlobal || canAnnouncePeak);
  const showCreateEventButton =
    activeTab === "event" && canCreateEvent;

  return (
    <div
      className="rounded-lg shadow-md p-5 mb-6"
      style={{ backgroundColor: "#2b1e10", border: "1px solid #332418" }}
    >
      {/* ================================================================= */}
      {/* 第一行：Tab切换 + 操作按钮                                          */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Tab 切换 */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "announcement" as TabType, label: "公告页面" },
            { key: "event" as TabType, label: "活动页面" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
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

        {/* 发布/创建按钮 */}
        {(showPublishButton || showCreateEventButton) && (
          <button
            onClick={showPublishButton ? onPublishClick : onCreateEventClick}
            className="px-5 py-2.5 font-medium text-[#f0e6c8] rounded-lg hover:opacity-90 transition-all whitespace-nowrap font-shan"
            style={{ backgroundColor: "#b94c00" }}
          >
            {showPublishButton ? "+ 发布公告" : "+ 创建活动"}
          </button>
        )}
      </div>

      {/* ================================================================= */}
      {/* 第二行：筛选条件                                                  */}
      {/* ================================================================= */}
      <div className="mt-4 pt-4 border-t border-[#332418]">
        {activeTab === "announcement" ? (
          // ---- 公告筛选 ----
          <div className="flex gap-2">
            {[
              { key: "all" as AnnouncementFilter, label: "全部" },
              { key: "global" as AnnouncementFilter, label: "宗门公告" },
              { key: "peak" as AnnouncementFilter, label: "本峰公告" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => onAnnouncementFilterChange(f.key)}
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
          // ---- 活动筛选 ----
          <div className="flex gap-2">
            {[
              { key: "all" as EventFilter, label: "全部活动" },
              { key: "peak" as EventFilter, label: "本峰活动" },
              { key: "completed" as EventFilter, label: "已结束" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => onEventFilterChange(f.key)}
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
  );
}