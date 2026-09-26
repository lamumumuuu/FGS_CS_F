// app/sect-affairs/components/useSectAffairs.ts

import { useState, useEffect, useCallback } from "react";
import { Disciple, PeakInfo, CurrentUser, SectPeak, SectRole } from "@/types/sect";
import { sectApi } from "@/app/api/client";
import { MEMBER_PERMISSIONS, PEAK_PERMISSIONS, SYSTEM_PERMISSIONS } from "@/types/permissions";

export function useSectAffairs(hasPermission: (perm: string) => boolean) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [peaks, setPeaks] = useState<PeakInfo[]>([]);
  const [allDisciples, setAllDisciples] = useState<Disciple[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterPeak, setFilterPeak] = useState<SectPeak | "全部">("全部");

  const [showPeakModal, setShowPeakModal] = useState(false);
  const [currentPeak, setCurrentPeak] = useState<PeakInfo | null>(null);
  const [peakMembers, setPeakMembers] = useState<Disciple[]>([]);
  const [showRolePermissionModal, setShowRolePermissionModal] = useState(false);
  const [showCreatePeakModal, setShowCreatePeakModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedDisciple, setSelectedDisciple] = useState<Disciple | null>(null);
  const [showDiscipleModal, setShowDiscipleModal] = useState(false);

  const [formData, setFormData] = useState<{ name: string; studentId: string; role: SectRole; peak: SectPeak | "无" }>({
    name: "", studentId: "", role: "外门弟子", peak: "项目峰",
  });
  const [moveTargetPeak, setMoveTargetPeak] = useState<SectPeak>("项目峰");
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [newPeakName, setNewPeakName] = useState("");
  const [newPeakDesc, setNewPeakDesc] = useState("");
  const [peakFormError, setPeakFormError] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; disciple: Disciple } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [user, peaksData, allData] = await Promise.all([
        sectApi.getCurrentUser(),
        sectApi.getAllPeaks(),
        sectApi.getAllDisciples(),
      ]);
      setCurrentUser(user);
      setPeaks(peaksData);
      setAllDisciples(allData);
    } catch {
      showToast("数据加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // 初始化加载
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllData();
  }, [loadAllData]);

  // 搜索/筛选
  useEffect(() => {
    let ignore = false;
    async function fetchDisciples() {
      try {
        let data: Disciple[];
        if (searchKeyword) data = await sectApi.searchDisciples(searchKeyword);
        else if (filterPeak !== "全部") data = await sectApi.filterDisciplesByPeak(filterPeak);
        else data = await sectApi.getAllDisciples();
        if (!ignore) setAllDisciples(data);
      } catch {
        // 静默处理
      }
    }
    fetchDisciples();
    return () => { ignore = true; };
  }, [searchKeyword, filterPeak]);

  // 权限
  const canManagePermissions = hasPermission(SYSTEM_PERMISSIONS.ADMIN);
  const canAddDisciple = hasPermission(MEMBER_PERMISSIONS.UPDATE_ROLE);
  const canDeleteDisciple = hasPermission(MEMBER_PERMISSIONS.EXPEL);
  const canMoveDisciple = hasPermission(PEAK_PERMISSIONS.MANAGE_MEMBERS);
  const canEditDisciple = hasPermission(MEMBER_PERMISSIONS.UPDATE_ROLE);
  const canCreatePeak = hasPermission(PEAK_PERMISSIONS.CREATE_DISBAND);
  const hasManagePermission = canAddDisciple || canDeleteDisciple;

  const sortedPeaks = [...peaks]
    .filter((p) => p.name !== "管理台" || canManagePermissions)
    .sort((a, b) =>
      ["管理台", "算法峰", "项目峰", "电路峰"].indexOf(a.name) -
      ["管理台", "算法峰", "项目峰", "电路峰"].indexOf(b.name)
    );
  const showAddCard = canCreatePeak || canAddDisciple;

  // 峰详情
  async function handlePeakClick(peak: PeakInfo) {
    if (peak.name === "管理台" && canManagePermissions) {
      setShowRolePermissionModal(true);
      return;
    }
    setCurrentPeak(peak);
    try {
      const members = await sectApi.getDisciplesByPeak(peak.name as SectPeak);
      setPeakMembers(members);
    } catch {
      setPeakMembers([]);
    }
    setShowPeakModal(true);
  }

  // 创建峰
  async function handleCreatePeak() {
    if (!canCreatePeak) {
      showToast("没有权限", "error");
      return;
    }
    setPeakFormError("");
    const name = newPeakName.trim();
    if (!name) { setPeakFormError("峰名称不能为空"); return; }
    if (name.length > 20) { setPeakFormError("峰名称长度不能超过20个字符"); return; }
    if (peaks.some((p) => p.name === name)) { setPeakFormError("该峰已存在"); return; }
    setActionLoading(true);
    try {
      await sectApi.addPeak(name, newPeakDesc);
      showToast(`开辟新峰成功：${name}`, "success");
      setShowCreatePeakModal(false);
      await loadAllData();
    } catch (err) {
      setPeakFormError(err instanceof Error ? err.message : "创建峰失败");
    } finally {
      setActionLoading(false);
    }
  }

  // 删除弟子
  async function handleDeleteDisciple(disciple: Disciple) {
    if (!canDeleteDisciple) { showToast("没有权限", "error"); return; }
    if (!confirm(`确定要删除弟子 ${disciple.name} 吗？`)) return;
    setActionLoading(true);
    try {
      await sectApi.deleteDisciple(disciple.id);
      showToast(`已删除弟子 ${disciple.name}`, "success");
      await loadAllData();
    } catch {
      showToast("删除失败", "error");
    } finally {
      setActionLoading(false);
    }
  }

  // 移动弟子
  async function handleMoveSubmit() {
    if (!selectedDisciple) return;
    if (!canMoveDisciple) { showToast("没有权限", "error"); return; }
    setActionLoading(true);
    try {
      await sectApi.moveDisciplePeak(selectedDisciple.id, moveTargetPeak);
      showToast(`已将 ${selectedDisciple.name} 移至 ${moveTargetPeak}`, "success");
      setShowMoveModal(false);
      await loadAllData();
    } catch {
      showToast("移动失败", "error");
    } finally {
      setActionLoading(false);
    }
  }

  // 添加弟子
  function handleAddDiscipleClick() {
    if (!canAddDisciple) { showToast("没有权限", "error"); return; }
    setFormData({ name: "", studentId: "", role: "外门弟子", peak: "项目峰" });
    setFormError("");
    setShowAddModal(true);
  }

  async function handleAddSubmit() {
    if (!canAddDisciple) { showToast("没有权限", "error"); return; }
    setFormError("");
    const name = formData.name.trim();
    if (!name) { setFormError("弟子姓名不能为空"); return; }
    if (name.length < 2 || name.length > 20) { setFormError("姓名长度需在2-20个字符"); return; }
    const sid = formData.studentId.trim();
    if (sid && !/^[a-zA-Z0-9_-]{3,20}$/.test(sid)) { setFormError("学号格式不正确"); return; }
    setActionLoading(true);
    try {
      await sectApi.addDisciple({
        name,
        studentId: sid,
        role: formData.role,
        peak: formData.peak,
        joinedAt: new Date().toISOString(),
      });
      showToast(`弟子 "${name}" 添加成功！默认密码：123456`, "success");
      setShowAddModal(false);
      await loadAllData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "添加失败");
    } finally {
      setActionLoading(false);
    }
  }

  // 编辑弟子
  async function handleEditSubmit() {
    if (!selectedDisciple) return;
    if (!canEditDisciple) { showToast("没有权限", "error"); return; }
    setFormError("");
    if (!formData.name.trim()) { setFormError("姓名不能为空"); return; }
    setActionLoading(true);
    try {
      await sectApi.updateDisciple(selectedDisciple.id, {
        name: formData.name,
        studentId: formData.studentId,
        role: formData.role,
        peak: formData.peak,
      });
      showToast("更新弟子信息成功", "success");
      setShowEditModal(false);
      await loadAllData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "更新失败");
    } finally {
      setActionLoading(false);
    }
  }

  // 右键菜单
  function handleContextMenu(e: React.MouseEvent, disciple: Disciple) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, disciple });
  }

  function handleMenuAction(action: string) {
    if (!contextMenu) return;
    const disciple = contextMenu.disciple;
    setSelectedDisciple(disciple);
    switch (action) {
      case "edit":
        if (!canEditDisciple) { showToast("没有权限", "error"); return; }
        setFormData({ name: disciple.name, studentId: disciple.studentId, role: disciple.role, peak: disciple.peak });
        setFormError("");
        setShowEditModal(true);
        break;
      case "move_peak":
        if (!canMoveDisciple) { showToast("没有权限", "error"); return; }
        setMoveTargetPeak(disciple.peak as SectPeak);
        setShowMoveModal(true);
        break;
      case "delete":
        if (!canDeleteDisciple) { showToast("没有权限", "error"); return; }
        handleDeleteDisciple(disciple);
        break;
    }
  }

  return {
    currentUser, loading, peaks, allDisciples, searchKeyword, setSearchKeyword, filterPeak, setFilterPeak,
    showPeakModal, setShowPeakModal, currentPeak, peakMembers, showRolePermissionModal, setShowRolePermissionModal,
    showCreatePeakModal, setShowCreatePeakModal, showAddModal, setShowAddModal, showEditModal, setShowEditModal,
    showMoveModal, setShowMoveModal, selectedDisciple, setSelectedDisciple, formData, setFormData,
    moveTargetPeak, setMoveTargetPeak, formError, setFormError, actionLoading, setActionLoading,
    showDiscipleModal, setShowDiscipleModal, newPeakName, setNewPeakName, newPeakDesc, setNewPeakDesc,
    peakFormError, setPeakFormError, toast, contextMenu, setContextMenu, loadAllData,
    handlePeakClick, handleCreatePeak, handleDeleteDisciple, handleMoveSubmit, handleAddSubmit, handleEditSubmit,
    handleContextMenu, handleMenuAction, handleAddDiscipleClick,
    canManagePermissions, canAddDisciple, canDeleteDisciple, canMoveDisciple, canEditDisciple, canCreatePeak,
    hasManagePermission, sortedPeaks, showAddCard,
  };
}