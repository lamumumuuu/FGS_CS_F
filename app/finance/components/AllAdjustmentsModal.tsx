"use client";

/**
 * 更多详情弹窗：展示全部灵石收支记录（深褐色风格，金色文字）
 *
 * 内部使用 AdjustmentCard 组件渲染每条记录。
 */

import Modal from "@/components/Modal";
import { LingshiAdjustment } from "./FinanceTypes";
import AdjustmentCard from "./AdjustmentCard";

interface AllAdjustmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  adjustments: LingshiAdjustment[];
}

export default function AllAdjustmentsModal({ isOpen, onClose, adjustments }: AllAdjustmentsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="全部收支记录"
      size="lg"
      containerStyle={{ backgroundColor: "#2b1e10" }}
      titleStyle={{ color: "#e6c068", borderColor: "#332418" }}
    >
      <div className="space-y-3">
        {adjustments.map((adj) => (
          <AdjustmentCard key={adj.id} adj={adj} />
        ))}
      </div>
    </Modal>
  );
}
