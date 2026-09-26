// app/announcement/components/AnnouncementList.tsx

/**
 * 公告列表组件
 * 
 * 职责：
 * 1. 渲染公告卡片列表
 * 2. 空状态展示
 * 3. 传递卡片交互事件
 */

import type { Announcement } from "@/app/api/client/modules/announcement";
import AnnouncementCard from "./Card";

interface AnnouncementListProps {
  announcements: Announcement[];
  onView: (ann: Announcement) => void;
  onEdit: (ann: Announcement) => void;
  onDelete: (ann: Announcement) => void;
  canEdit: boolean;
  getPeakName: (peakId?: number | null) => string;
}

export default function AnnouncementList({
  announcements,
  onView,
  onEdit,
  onDelete,
  canEdit,
  getPeakName,
}: AnnouncementListProps) {
  if (announcements.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((ann) => (
        <AnnouncementCard
          key={ann.id}
          mode="announcement"
          announcement={ann}
          peakName={getPeakName(ann.peakId)}
          onView={onView}
          canEdit={canEdit}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}