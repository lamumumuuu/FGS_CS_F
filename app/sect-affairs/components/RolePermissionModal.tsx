// app/sect-affairs/components/RolePermissionModal.tsx

/**
 * 角色权力调整模态框组件
 * 
 * 展示宗门所有角色及其权限配置，允许宗主/管理员对不同角色的权限进行配置与修改。
 * 权限数据完全从数据库获取，确保前后端数据一致。
 * 
 * 左侧选项下方集成"删除山峰"功能入口，可移除指定山峰及其关联数据。
 */

"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import DeletePeakModal from "@/app/sect-affairs/components/DeletePeakModal";
import UserBindingModal from "@/app/sect-affairs/components/UserBindingModal";
import OrgHistoryModal from "@/app/sect-affairs/components/OrgHistoryModal";
import { Role, Permission } from "@/types/rbac";
import { PeakInfo } from "@/types/sect";
import { rbacApi, sectApi } from "@/app/api/client";

interface RolePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasManagePermission: boolean;
  currentUserRole?: string;
}

export default function RolePermissionModal({
  isOpen,
  onClose,
  hasManagePermission,
  currentUserRole,
}: RolePermissionModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 根据权限和当前用户角色判断是否可管理
  // 只有管理员或宗主角色才能修改权限
  const canManage = hasManagePermission || currentUserRole === "宗主";

  // 删除山峰相关状态
  const [peaks, setPeaks] = useState<PeakInfo[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPeak, setSelectedPeak] = useState<PeakInfo | null>(null);
  const [showUserBinding, setShowUserBinding] = useState(false);
  const [showOrgHistory, setShowOrgHistory] = useState(false);

  // 角色维护（CRUD）：标识仅创建时可填，展示名/宗门展示名可编辑
  const [roleDraft, setRoleDraft] = useState({
    name: "",
    displayName: "",
    fantasyDisplayName: "",
    description: "",
  });
  const [roleSaving, setRoleSaving] = useState(false);

  useEffect(() => {
    if (!selectedRole) return;
    // 选中角色变化时把表单回填为该角色（与 useSectAffairs 的既有写法一致）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoleDraft({
      name: selectedRole.name,
      displayName: selectedRole.baseDisplayName || selectedRole.displayName,
      fantasyDisplayName: selectedRole.fantasyDisplayName || "",
      description: selectedRole.description || "",
    });
  }, [selectedRole]);

  /** 重新拉取角色与权限（角色 CRUD 后保持选中项） */
  const reloadRoles = async (selectId?: string) => {
    const [rolesData, permissionsData] = await Promise.all([
      rbacApi.getAllRoles(),
      rbacApi.getAllPermissions(),
    ]);
    setRoles(rolesData);
    setAllPermissions(permissionsData);
    const perms: Record<string, string[]> = {};
    for (const role of rolesData) {
      const rolePerms = await rbacApi.getRolePermissions(role.id);
      perms[role.id] = rolePerms.map((p) => p.id);
    }
    setRolePermissions(perms);
    setSelectedRole((prev) => {
      const target = selectId ?? prev?.id;
      return rolesData.find((role) => role.id === target) ?? rolesData[0] ?? null;
    });
  };

  const handleCreateRole = async () => {
    if (!canManage) return;
    const name = roleDraft.name.trim();
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      alert("角色标识需以小写字母开头，仅含小写字母、数字、下划线");
      return;
    }
    if (!roleDraft.displayName.trim()) {
      alert("请填写角色展示名");
      return;
    }
    setRoleSaving(true);
    setError("");
    try {
      const created = await rbacApi.createRole({
        name,
        displayName: roleDraft.displayName.trim(),
        fantasyDisplayName: roleDraft.fantasyDisplayName.trim(),
        description: roleDraft.description.trim(),
      });
      await reloadRoles(created.id);
      alert("角色创建成功");
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建角色失败");
    } finally {
      setRoleSaving(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!canManage || !selectedRole) return;
    if (!roleDraft.displayName.trim()) {
      alert("请填写角色展示名");
      return;
    }
    setRoleSaving(true);
    setError("");
    try {
      await rbacApi.updateRole(selectedRole.id, {
        displayName: roleDraft.displayName.trim(),
        fantasyDisplayName: roleDraft.fantasyDisplayName.trim(),
        description: roleDraft.description.trim(),
      });
      await reloadRoles(selectedRole.id);
      alert("角色资料已更新");
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新角色失败");
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!canManage || !selectedRole) return;
    if (selectedRole.isSystem || selectedRole.isProtected) {
      alert("系统内置/保护角色不可删除");
      return;
    }
    if (!confirm(`确认删除角色「${selectedRole.displayName}」？此操作不可恢复。`)) return;
    setRoleSaving(true);
    setError("");
    try {
      await rbacApi.deleteRole(selectedRole.id);
      await reloadRoles();
      alert("角色已删除");
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除角色失败");
    } finally {
      setRoleSaving(false);
    }
  };

  /** 加载山峰列表 */
  const loadPeaks = async () => {
    try {
      const data = await sectApi.getAllPeaks();
      setPeaks(data || []);
    } catch { }
  };

  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        // 同时加载角色数据和山峰数据
        const [rolesData, permissionsData] = await Promise.all([
          rbacApi.getAllRoles(),
          rbacApi.getAllPermissions(),
        ]);
        setRoles(rolesData);
        setAllPermissions(permissionsData);

        if (rolesData.length > 0) {
          setSelectedRole(rolesData[0]);
        }

        const perms: Record<string, string[]> = {};
        for (const role of rolesData) {
          const rolePerms = await rbacApi.getRolePermissions(role.id);
          perms[role.id] = rolePerms.map((p) => p.id);
        }
        setRolePermissions(perms);

        // 加载山峰列表（用于删除功能）
        const peakData = await sectApi.getAllPeaks();
        setPeaks(peakData || []);
      } catch (err) {
        console.error("加载权限数据失败:", err);
        setError(
          err instanceof Error && err.message
            ? `加载权限数据失败：${err.message}`
            : "加载权限数据失败，请稍后重试"
        );
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isOpen]);

  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const moduleKey = perm.module || "其他";
    if (!acc[moduleKey]) {
      acc[moduleKey] = [];
    }
    acc[moduleKey].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const togglePermission = (permissionId: string) => {
    if (!canManage || !selectedRole) return;
    setRolePermissions((prev) => {
      const current = prev[selectedRole.id] || [];
      const next = current.includes(permissionId)
        ? current.filter((p) => p !== permissionId)
        : [...current, permissionId];
      return { ...prev, [selectedRole.id]: next };
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setError("");
    try {
      await rbacApi.updateRolePermissions(
        selectedRole.id,
        rolePermissions[selectedRole.id] || []
      );
      alert("权限配置更新成功");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="角色权力调整" size="lg">
      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => {
              setError("");
              setLoading(true);
              const loadData = async () => {
                try {
                  const [rolesData, permissionsData] = await Promise.all([
                    rbacApi.getAllRoles(),
                    rbacApi.getAllPermissions(),
                  ]);
                  setRoles(rolesData);
                  setAllPermissions(permissionsData);
                  if (rolesData.length > 0) {
                    setSelectedRole(rolesData[0]);
                  }
                } catch { }
                setLoading(false);
              };
              loadData();
            }}
            className="px-4 py-2 text-white rounded-xl text-sm"
            style={{ background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)" }}
          >
            重新加载
          </button>
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无角色数据</div>
      ) : (
        <div className="flex gap-4 h-[500px]">
          <div className="w-48 flex-shrink-0 overflow-y-auto pr-1">
            {canManage && (
              <button
                type="button"
                onClick={() => setShowUserBinding(true)}
                className="w-full mb-3 px-3 py-2 rounded-lg text-sm text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)" }}
              >
                用户授权
              </button>
            )}
            {canManage && (
              <button
                type="button"
                onClick={() => setShowOrgHistory(true)}
                className="w-full mb-3 px-3 py-2 rounded-lg text-sm border border-teal-600 text-teal-700 hover:bg-teal-50 transition-all"
              >
                组织历史
              </button>
            )}
            <h4 className="text-sm font-semibold text-gray-700 mb-2">角色列表</h4>
            <div className="space-y-1 max-h-[280px] overflow-y-auto">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedRole?.id === role.id
                    ? "text-white font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                    }`}
                  style={
                    selectedRole?.id === role.id
                      ? { background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)" }
                      : {}
                  }
                >
                  {role.displayName}
                  <span className="text-xs opacity-70 ml-1">
                    ({(rolePermissions[role.id] || []).length})
                  </span>
                </button>
              ))}
            </div>

            {/* 角色维护入口（仅管理员/宗主可见）：创建 / 改名 / 删除 */}
            {canManage && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">角色维护</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setRoleDraft({ name: "", displayName: "", fantasyDisplayName: "", description: "" })
                    }
                    className="text-xs px-2 py-1 rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50 transition-all"
                  >
                    新建角色
                  </button>
                </div>
                <div className="space-y-1.5">
                  <input
                    value={roleDraft.name}
                    onChange={(e) => setRoleDraft((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="角色标识（小写英文）"
                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-300 bg-white focus:border-teal-500 focus:outline-none"
                  />
                  <input
                    value={roleDraft.displayName}
                    onChange={(e) => setRoleDraft((prev) => ({ ...prev, displayName: e.target.value }))}
                    placeholder="展示名"
                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-300 bg-white focus:border-teal-500 focus:outline-none"
                  />
                  <input
                    value={roleDraft.fantasyDisplayName}
                    onChange={(e) => setRoleDraft((prev) => ({ ...prev, fantasyDisplayName: e.target.value }))}
                    placeholder="宗门展示名（可选）"
                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-300 bg-white focus:border-teal-500 focus:outline-none"
                  />
                  <input
                    value={roleDraft.description}
                    onChange={(e) => setRoleDraft((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="描述（可选）"
                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-300 bg-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={handleCreateRole}
                    disabled={roleSaving}
                    className="flex-1 text-xs px-2 py-1.5 rounded-lg text-white font-medium transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)" }}
                  >
                    新建
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateRole}
                    disabled={roleSaving || !selectedRole}
                    className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-teal-600 text-teal-700 font-medium transition-all disabled:opacity-50"
                  >
                    保存
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteRole}
                  disabled={roleSaving || !selectedRole || !!selectedRole.isSystem || !!selectedRole.isProtected}
                  className="w-full mt-1.5 text-xs px-2 py-1.5 rounded-lg text-red-600 border border-red-200 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  删除角色
                </button>
              </div>
            )}

            {/* 删除山峰入口（仅管理员/宗主可见） */}
            {canManage && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                  <span>⛰️</span>
                  <span>山峰管理</span>
                </h4>
                <select
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 mb-2 focus:border-red-400 focus:outline-none"
                  value={selectedPeak?.id || ""}
                  onChange={(e) => {
                    const peak = peaks.find((p) => p.id === e.target.value);
                    setSelectedPeak(peak || null);
                  }}
                >
                  <option value="">选择山峰</option>
                  {peaks
                    .filter((p) => p.name !== "管理台" && p.name !== "_TREASURY_")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.memberCount || 0}人)
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    if (!selectedPeak) {
                      alert("请先选择要删除的山峰");
                      return;
                    }
                    setDeleteModalOpen(true);
                  }}
                  disabled={!selectedPeak}
                  className="w-full text-xs px-3 py-2 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: selectedPeak
                      ? "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
                      : "#6b7280",
                  }}
                >
                  删除山峰
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            {selectedRole ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {selectedRole.displayName} - 权限配置
                  </h4>
                  {!canManage && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      只读模式
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {Object.entries(groupedPermissions).map(([moduleKey, permissions]) => (
                    <div key={moduleKey}>
                      <h5 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: "#0D9488" }}
                        />
                        {moduleKey}
                      </h5>
                      <div className="grid grid-cols-2 gap-1.5">
                        {permissions.map((perm) => {
                          const isChecked = (rolePermissions[selectedRole.id] || []).includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${isChecked
                                ? "border"
                                : "bg-gray-50 border border-transparent hover:border-gray-200"
                                } ${!canManage ? "cursor-not-allowed opacity-80" : ""}`}
                              style={
                                isChecked
                                  ? {
                                    backgroundColor: "rgba(15, 118, 110, 0.08)",
                                    borderColor: "rgba(15, 118, 110, 0.25)",
                                    color: "#0F766E",
                                  }
                                  : {}
                              }
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(perm.id)}
                                disabled={!canManage}
                                className="w-3.5 h-3.5 rounded accent-teal-600"
                              />
                              <span>{perm.displayName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t mt-3"
                  style={{ borderColor: "rgba(15, 118, 110, 0.12)" }}
                >
                  <span className="text-xs text-gray-500">
                    已配置 {(rolePermissions[selectedRole.id] || []).length} 项权限
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                      style={{ borderColor: "rgba(15, 118, 110, 0.3)" }}
                    >
                      关闭
                    </button>
                    {canManage && (
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 text-white rounded-xl hover:opacity-90 transition-all text-sm font-medium disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)" }}
                      >
                        {saving ? "保存中..." : "保存修改"}
                      </button>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="mt-2 text-sm text-red-600 px-3 py-2 bg-red-50 rounded-lg">
                    {error}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">请选择一个角色</div>
            )}
          </div>
        </div>
      )}

      {/* 删除山峰确认弹窗 */}
      <DeletePeakModal
        isOpen={deleteModalOpen}
        peak={selectedPeak ? { id: selectedPeak.id, name: selectedPeak.name, description: selectedPeak.description, memberCount: selectedPeak.memberCount } : null}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={() => {
          // 删除成功后刷新山峰列表
          loadPeaks();
          setSelectedPeak(null);
        }}
      />
    </Modal>
    {canManage && (
      <UserBindingModal
        isOpen={showUserBinding}
        onClose={() => setShowUserBinding(false)}
      />
    )}
    {canManage && (
      <OrgHistoryModal
        isOpen={showOrgHistory}
        onClose={() => setShowOrgHistory(false)}
      />
    )}
    </>
  );
}