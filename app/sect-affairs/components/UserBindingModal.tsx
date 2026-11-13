// app/sect-affairs/components/UserBindingModal.tsx

/**
 * 用户角色授权弹窗：按用户整组替换角色绑定（own / peak / all 作用范围）。
 *
 * 后端契约：GET/PUT /api/admin/users/{user_id}/role-bindings（If-Match 授权版本）。
 * 角色与峰来自统一 RBAC/组织接口；账号资料与角色字符串不再由成员档案维护。
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { rbacApi, sectApi } from "@/app/api/client";
import type { Role, Peak } from "@/types/rbac";
import type { Disciple } from "@/types/sect";

interface BindingRow {
  roleId: string;
  scopeType: "own" | "peak" | "all";
  scopePeakId: string;
}

interface UserBindingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserBindingModal({ isOpen, onClose }: UserBindingModalProps) {
  const [users, setUsers] = useState<Disciple[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [peaks, setPeaks] = useState<Peak[]>([]);
  const [userId, setUserId] = useState("");
  const [version, setVersion] = useState(1);
  const [rows, setRows] = useState<BindingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setUserId("");
    setRows([]);
    setLoaded(false);
    (async () => {
      try {
        const [members, roleList, peakList] = await Promise.all([
          sectApi.getAllDisciples(),
          rbacApi.getAllRoles(),
          rbacApi.getAllPeaks(),
        ]);
        setUsers(members.filter((member) => typeof member.userId === "number"));
        setRoles(roleList);
        setPeaks(peakList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载基础数据失败");
      }
    })();
  }, [isOpen]);

  const loadBindings = useCallback(async (value: string) => {
    if (!value) {
      setLoaded(false);
      setRows([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await rbacApi.getUserBindings(Number(value));
      setVersion(result.authorizationVersion ?? 1);
      setRows(
        (result.bindings ?? []).map((binding) => ({
          roleId: String(binding.roleId),
          scopeType:
            binding.scopeType === "peak" || binding.scopeType === "all"
              ? binding.scopeType
              : "own",
          scopePeakId: binding.scopePeakId ? String(binding.scopePeakId) : "",
        })),
      );
      setLoaded(true);
    } catch (err) {
      setLoaded(false);
      setError(err instanceof Error ? err.message : "读取角色绑定失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRow = (index: number, patch: Partial<BindingRow>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { roleId: roles[0]?.id ?? "", scopeType: "own", scopePeakId: "" },
    ]);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError("");
    try {
      const result = await rbacApi.updateUserBindings(
        Number(userId),
        version,
        rows
          .filter((row) => row.roleId)
          .map((row) => ({
            roleId: Number(row.roleId),
            scopeType: row.scopeType,
            scopePeakId: row.scopeType === "peak" && row.scopePeakId ? Number(row.scopePeakId) : null,
          })),
      );
      setVersion(result.authorizationVersion ?? version);
      alert("用户授权已保存");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="用户授权" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">选择用户</label>
          <select
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              void loadBindings(e.target.value);
            }}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">—</option>
            {users.map((user) => (
              <option key={user.id} value={user.userId}>
                {user.name} (#{user.userId})
              </option>
            ))}
          </select>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {loading && <div className="text-sm text-gray-500">加载中...</div>}

        {loaded && !loading && (
          <>
            <div className="text-xs text-gray-500">
              授权版本 {version} · 作用范围：own=本人，peak=指定峰，all=全范围
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {rows.length === 0 && (
                <div className="text-sm text-gray-500">该用户暂无角色绑定</div>
              )}
              {rows.map((row, index) => (
                <div key={`${index}-${row.roleId}`} className="flex flex-wrap items-center gap-2">
                  <select
                    value={row.roleId}
                    onChange={(e) => updateRow(index, { roleId: e.target.value })}
                    className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                  >
                    <option value="">选择角色</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.displayName} ({role.name})
                      </option>
                    ))}
                  </select>
                  <select
                    value={row.scopeType}
                    onChange={(e) =>
                      updateRow(index, {
                        scopeType: e.target.value as BindingRow["scopeType"],
                        scopePeakId: e.target.value === "peak" ? row.scopePeakId : "",
                      })
                    }
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                  >
                    <option value="own">own</option>
                    <option value="peak">peak</option>
                    <option value="all">all</option>
                  </select>
                  {row.scopeType === "peak" && (
                    <select
                      value={row.scopePeakId}
                      onChange={(e) => updateRow(index, { scopePeakId: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                    >
                      <option value="">选择峰</option>
                      {peaks.map((peak) => (
                        <option key={peak.id} value={peak.id}>
                          {peak.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={addRow}
                className="px-4 py-2 rounded-xl text-sm border border-teal-600 text-teal-700 hover:bg-teal-50"
              >
                添加绑定
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)" }}
              >
                {saving ? "保存中..." : "保存授权"}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
