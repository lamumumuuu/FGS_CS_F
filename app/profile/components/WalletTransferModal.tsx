// app/profile/components/WalletTransferModal.tsx

/**
 * 灵石转账与本人流水弹窗（PA12）。
 *
 * 付款人由后端按登录身份决定；每次提交生成 Idempotency-Key，重复点击不会双扣。
 * 团队任务奖励全额进入队长余额后，队长可在此自由转账分配。
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { walletApi, type WalletEntryRow, type WalletRecipient } from "@/app/api/client";

interface WalletTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 转账成功后通知父级刷新余额 */
  onSuccess?: () => void;
}

export default function WalletTransferModal({
  isOpen,
  onClose,
  onSuccess,
}: WalletTransferModalProps) {
  const [query, setQuery] = useState("");
  const [recipients, setRecipients] = useState<WalletRecipient[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [entries, setEntries] = useState<WalletEntryRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadEntries = useCallback(async () => {
    try {
      setEntries(await walletApi.getMyEntries(20));
    } catch {
      // 流水读取失败不阻断转账主流程
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setMessage("");
    setError("");
    void loadEntries();
  }, [isOpen, loadEntries]);

  const handleSearch = async () => {
    setError("");
    setMessage("");
    const keyword = query.trim();
    if (keyword.length < 3) {
      setError("请输入至少 3 个字符的用户名或展示名");
      return;
    }
    setSearching(true);
    try {
      const rows = await walletApi.searchRecipients(keyword);
      setRecipients(rows);
      setRecipientId(rows.length > 0 ? String(rows[0].user_id) : "");
      if (rows.length === 0) setError("未找到收款人");
    } catch (err) {
      setError(err instanceof Error ? err.message : "搜索失败");
    } finally {
      setSearching(false);
    }
  };

  const handleTransfer = async () => {
    setError("");
    setMessage("");
    if (!recipientId) {
      setError("请先搜索并选择收款人");
      return;
    }
    if (!/^[1-9][0-9]*$/.test(amount)) {
      setError("金额必须为正整数");
      return;
    }
    setSaving(true);
    try {
      await walletApi.transfer(Number(recipientId), amount, remark.trim() || undefined);
      setMessage("转账成功");
      setAmount("");
      setRemark("");
      setRecipients([]);
      setRecipientId("");
      setQuery("");
      await loadEntries();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "转账失败");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="灵石转账" size="lg">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">搜索收款人</h4>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="用户名 / 展示名（至少 3 个字符）"
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-300 bg-white focus:border-teal-500 focus:outline-none"
              maxLength={50}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2 text-white rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)" }}
            >
              {searching ? "搜索中..." : "搜索"}
            </button>
          </div>
        </div>

        {recipients.length > 0 && (
          <div className="space-y-2">
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 bg-white focus:border-teal-500 focus:outline-none"
            >
              {recipients.map((item) => (
                <option key={item.user_id} value={item.user_id}>
                  {item.display_name || item.username || item.user_id}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="金额"
                inputMode="numeric"
                className="w-32 text-sm px-3 py-2 rounded-lg border border-gray-300 bg-white focus:border-teal-500 focus:outline-none"
              />
              <input
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="备注（可选）"
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-300 bg-white focus:border-teal-500 focus:outline-none"
                maxLength={200}
              />
            </div>
            <button
              type="button"
              onClick={handleTransfer}
              disabled={saving || !amount || amount === "0"}
              className="w-full px-4 py-2 text-white rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)" }}
            >
              {saving ? "转账中..." : "确认转账"}
            </button>
          </div>
        )}

        {message && (
          <div className="text-sm text-teal-700 bg-teal-50 px-3 py-2 rounded-lg">{message}</div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">最近流水</h4>
          {entries.length === 0 ? (
            <div className="text-sm text-gray-400 py-4 text-center">暂无流水</div>
          ) : (
            <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {entries.map((entry) => {
                const delta = Number(entry.delta);
                return (
                  <div key={entry.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-xs text-gray-400">{entry.created_at ?? "—"}</span>
                    <span className="flex items-center gap-4">
                      <span className="text-xs text-gray-400">余额 {entry.balance_after}</span>
                      <span className={delta > 0 ? "text-green-600" : "text-red-600"}>
                        {delta > 0 ? "+" : ""}
                        {delta}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
