// app/sect-affairs/components/DiscipleForms.tsx

/**
 * 弟子表单模态框组件
 *
 * 包含添加、编辑、移动弟子的表单。
 * 统一视觉风格：青绿主色调 + 圆角 + 与系统其他窗口一致。
 */

"use client";

import { Disciple, SectRole, SectPeak } from "@/types/sect";
import Modal from "@/components/Modal";

interface AddFormProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    name: string;
    studentId: string;
    role: SectRole;
    peak: SectPeak | "无";
  };
  onFormChange: (data: {
    name: string;
    studentId: string;
    role: SectRole;
    peak: SectPeak | "无";
  }) => void;
  onSubmit: () => void;
  error: string;
  isLoading: boolean;
  peaks?: SectPeak[];
}

interface EditFormProps {
  isOpen: boolean;
  onClose: () => void;
  disciple: Disciple | null;
  formData: {
    name: string;
    studentId: string;
    role: SectRole;
    peak: SectPeak | "无";
  };
  onFormChange: (data: {
    name: string;
    studentId: string;
    role: SectRole;
    peak: SectPeak | "无";
  }) => void;
  onSubmit: () => void;
  error: string;
  isLoading: boolean;
  peaks?: SectPeak[];
}

interface MoveFormProps {
  isOpen: boolean;
  onClose: () => void;
  disciple: Disciple | null;
  targetPeak: SectPeak;
  onTargetPeakChange: (peak: SectPeak) => void;
  onSubmit: () => void;
  isLoading: boolean;
  peaks?: SectPeak[];
}

const ROLE_OPTIONS: SectRole[] = [
  "外门弟子",
  "内门弟子",
  "长老",
  "荣誉长老",
  "太上长老",
  "大长老",
  "宗主",
];

// 默认峰选项（排除"管理台"——管理台属于系统控制面板而非业务峰）
const DEFAULT_PEAK_OPTIONS: SectPeak[] = ["项目峰", "算法峰", "电路峰"];

/** 统一输入框样式类 */
const inputClass =
  "w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition-all";
const inputStyle = { borderColor: "rgba(15, 118, 110, 0.2)" };

/** 主要按钮样式 */
const primaryBtnClass =
  "flex-1 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all font-medium disabled:opacity-50";
const primaryBtnStyle = { background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)" };

/** 次要按钮样式 */
const secondaryBtnClass =
  "flex-1 px-4 py-2.5 border text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium";
const secondaryBtnStyle = { borderColor: "rgba(15, 118, 110, 0.3)" };

export function AddDiscipleForm({
  isOpen,
  onClose,
  formData,
  onFormChange,
  onSubmit,
  error,
  isLoading,
  peaks = DEFAULT_PEAK_OPTIONS,
}: AddFormProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="添加弟子">
      <div className="space-y-5">
        {error && (
          <div className="text-red-700 text-sm px-4 py-2.5 rounded-lg border border-red-200" style={{ backgroundColor: "rgba(254, 226, 226, 0.6)" }}>
            {error}
          </div>
        )}
        <div className="text-xs text-teal-700 px-3 py-2.5 rounded-lg border" style={{ backgroundColor: "rgba(15, 118, 110, 0.08)", borderColor: "rgba(15, 118, 110, 0.15)" }}>
          <span className="font-semibold">💡 自动创建账号</span>：添加弟子将同时创建用户账号，默认密码为 <span className="font-mono font-bold text-teal-800">123456</span>，弟子可使用此账号登录系统。
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F766E" }}>
            弟子姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
            className={inputClass}
            style={{ ...inputStyle, borderWidth: "2px" }}
            placeholder="请输入弟子姓名（将作为登录账号）"
            maxLength={20}
          />
          <p className="text-xs text-gray-400 mt-1">{formData.name.length}/20 字符</p>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F766E" }}>
            学号
          </label>
          <input
            type="text"
            value={formData.studentId}
            onChange={(e) => onFormChange({ ...formData, studentId: e.target.value })}
            className={inputClass}
            style={{ ...inputStyle, borderWidth: "2px" }}
            placeholder="请输入学号（选填，3-20位字母数字）"
            maxLength={20}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F766E" }}>
            担当角色
          </label>
          <select
            value={formData.role}
            onChange={(e) => onFormChange({ ...formData, role: e.target.value as SectRole })}
            className={inputClass}
            style={{ ...inputStyle, borderWidth: "2px" }}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F766E" }}>
            所属门派
          </label>
          <select
            value={formData.peak}
            onChange={(e) => onFormChange({ ...formData, peak: e.target.value as SectPeak | "无" })}
            className={inputClass}
            style={{ ...inputStyle, borderWidth: "2px" }}
          >
            <option value="无">无（不分配门派）</option>
            {peaks.map((peak) => (
              <option key={peak} value={peak}>
                {peak}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className={secondaryBtnClass}
            style={{ ...secondaryBtnStyle, borderWidth: "2px" }}
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading || !formData.name.trim()}
            className={primaryBtnClass}
            style={{
              background: formData.name.trim()
                ? "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)"
                : "#94A3B8",
              boxShadow: formData.name.trim() ? "0 4px 12px rgba(15, 118, 110, 0.25)" : "none",
            }}
          >
            {isLoading ? "创建中..." : "确认添加"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function EditDiscipleForm({
  isOpen,
  onClose,
  disciple,
  formData,
  onFormChange,
  onSubmit,
  error,
  isLoading,
  peaks = DEFAULT_PEAK_OPTIONS,
}: EditFormProps) {
  if (!disciple) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="编辑弟子信息">
      <div className="space-y-4">
        {error && (
          <div className="text-red-600 text-sm px-3 py-2 bg-red-50 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            弟子姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
            className={inputClass}
            style={inputStyle}
            placeholder="请输入弟子姓名"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            学号
          </label>
          <input
            type="text"
            value={formData.studentId}
            onChange={(e) => onFormChange({ ...formData, studentId: e.target.value })}
            className={inputClass}
            style={inputStyle}
            placeholder="请输入学号"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            担当角色
          </label>
          <select
            value={formData.role}
            onChange={(e) => onFormChange({ ...formData, role: e.target.value as SectRole })}
            className={inputClass}
            style={inputStyle}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            所属门派
          </label>
          <select
            value={formData.peak}
            onChange={(e) => onFormChange({ ...formData, peak: e.target.value as SectPeak | "无" })}
            className={inputClass}
            style={inputStyle}
          >
            <option value="无">无</option>
            {peaks.map((peak) => (
              <option key={peak} value={peak}>
                {peak}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className={secondaryBtnClass}
            style={secondaryBtnStyle}
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className={primaryBtnClass}
            style={primaryBtnStyle}
          >
            {isLoading ? "更新中..." : "更新"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function MoveDiscipleForm({
  isOpen,
  onClose,
  disciple,
  targetPeak,
  onTargetPeakChange,
  onSubmit,
  isLoading,
  peaks = DEFAULT_PEAK_OPTIONS,
}: MoveFormProps) {
  if (!disciple) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="移动门派">
      <div className="space-y-4">
        <div className="text-center py-2">
          <div className="text-gray-500 text-sm">将弟子移动至</div>
          <div className="text-xl font-bold text-gray-800 mt-1">
            {disciple.name}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            目标门派
          </label>
          <select
            value={targetPeak}
            onChange={(e) => onTargetPeakChange(e.target.value as SectPeak)}
            className={inputClass}
            style={inputStyle}
          >
            {peaks.map((peak) => (
              <option key={peak} value={peak}>
                {peak}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className={secondaryBtnClass}
            style={secondaryBtnStyle}
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className={primaryBtnClass}
            style={primaryBtnStyle}
          >
            {isLoading ? "移动中..." : "确认移动"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** 删除确认表单 */
interface DeleteFormProps {
  isOpen: boolean;
  onClose: () => void;
  disciple: Disciple | null;
  reason: string;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error?: string;
}

export function DeleteDiscipleForm({
  isOpen,
  onClose,
  disciple,
  reason,
  onReasonChange,
  onSubmit,
  isLoading,
  error,
}: DeleteFormProps) {
  if (!disciple) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="删除弟子">
      <div className="space-y-4">
        {error && (
          <div className="text-red-600 text-sm px-3 py-2 bg-red-50 rounded-lg">
            {error}
          </div>
        )}
        <div className="text-center py-2">
          <div className="text-red-500 text-sm">⚠️ 警告：此操作将级联删除用户账号及所有关联数据</div>
          <div className="text-xl font-bold text-gray-800 mt-2">
            {disciple.name}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            角色：{disciple.role} | 门派：{disciple.peak}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            删除原因 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            className={`${inputClass} min-h-[80px]`}
            style={inputStyle}
            placeholder="请输入删除原因（必填）"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className={secondaryBtnClass}
            style={secondaryBtnStyle}
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading || !reason.trim()}
            className={primaryBtnClass}
            style={{ background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)" }}
          >
            {isLoading ? "删除中..." : "确认删除"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** 历史记录查看弹窗 */
interface HistoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  history: Array<{
    id: number;
    operation: string;
    operatorName: string;
    createTime: string;
    beforeData?: string;
    afterData?: string;
  }>;
  title?: string;
}

export function HistoryDialog({
  isOpen,
  onClose,
  history,
  title = "弟子调整历史记录",
}: HistoryFormProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>暂无历史记录</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {history.map((record) => (
              <div
                key={record.id}
                className="p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {record.operation}
                  </span>
                  <span className="text-xs text-gray-500">
                    {record.createTime}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  操作人：{record.operatorName}
                </div>
                {record.beforeData && (
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="text-red-600">之前：</span>
                    {record.beforeData}
                  </div>
                )}
                {record.afterData && (
                  <div className="text-xs text-gray-500">
                    <span className="text-green-600">之后：</span>
                    {record.afterData}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className={primaryBtnClass}
            style={primaryBtnStyle}
          >
            关闭
          </button>
        </div>
      </div>
    </Modal>
  );
}