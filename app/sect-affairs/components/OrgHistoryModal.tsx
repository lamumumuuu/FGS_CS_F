// app/sect-affairs/components/OrgHistoryModal.tsx

/**
 * 组织历史弹窗：读取统一审计中的成员组织变更（创建/编辑/调峰/离会）。
 *
 * 入口仅对管理角色展示；后端以 audit:read + 全范围校验，峰范围账号会被拒绝。
 */

"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { sectApi } from "@/app/api/client";
import type { OrganizationHistoryItem } from "@/app/api/client/modules/sect";

interface OrgHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrgHistoryModal({ isOpen, onClose }: OrgHistoryModalProps) {
  const [items, setItems] = useState<OrganizationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");
    (async () => {
      try {
        setItems(await sectApi.getOrganizationHistory(20));
      } catch (err) {
        setError(err instanceof Error ? err.message : "读取组织历史失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="组织历史" size="lg">
      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600 text-sm">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">暂无历史记录</div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-teal-700">{item.action}</span>
                <span className="text-xs text-gray-500">#{item.resourceId ?? "—"}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {item.actorUsername || "—"} ·{" "}
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                </span>
              </div>
              {item.detail && (
                <div className="mt-1 text-xs text-gray-500 break-all">
                  {JSON.stringify(item.detail)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
