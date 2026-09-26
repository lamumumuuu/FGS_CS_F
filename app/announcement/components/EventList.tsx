// app/announcement/components/EventList.tsx

/**
 * 活动列表组件
 * 
 * 职责：
 * 1. 渲染活动卡片列表
 * 2. 空状态展示
 * 3. 传递卡片交互事件
 */

import type { Event } from "@/app/api/client/modules/event";
import AnnouncementCard from "./Card";

interface EventListProps {
  events: Event[];
  onView: (event: Event) => void;
  onEdit: (event: Event) => void;
  canManage: (event: Event) => boolean;
  getPeakName: (peakId?: number | null) => string;
}

export default function EventList({
  events,
  onView,
  onEdit,
  canManage,
  getPeakName,
}: EventListProps) {
  if (events.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {events.map((evt) => (
        <AnnouncementCard
          key={evt.id}
          mode="event"
          event={evt}
          canManage={canManage(evt)}
          onEdit={onEdit}
          onView={onView}
          getPeakName={getPeakName}
        />
      ))}
    </div>
  );
}