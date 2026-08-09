// app/sect-affairs/page.tsx

/**
 * 宗门事务页面
 *
 * 上方：画廊展示各峰 + 开辟新峰入口（等距排列）
 * 下方：弟子名册（搜索 / 筛选 / 右键菜单 / 增删改查）
 *
 * 交互：
 * - 左右箭头按钮移动
 * - 触摸滑动（移动端）
 * - 点击卡片查看峰详情
 * - 右键菜单操作弟子
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Disciple,
  PeakInfo,
  CurrentUser,
  SectPeak,
  SectRole,
  ContextMenuItem,
} from "@/types/sect";
import { sectApi } from "@/app/api/client";
import ContextMenu from "@/components/ContextMenu";
import Modal from "@/components/Modal";
import { usePermission } from "@/contexts/PermissionContext";
import { MEMBER_PERMISSIONS, PEAK_PERMISSIONS, FINANCE_PERMISSIONS, SYSTEM_PERMISSIONS } from "@/types/permissions";
import PeakCard from "./components/PeakCard";
import AddCard from "./components/AddCard";
import PeakModal from "./components/PeakModal";
import RolePermissionModal from "./components/RolePermissionModal";
import DiscipleTable from "./components/DiscipleTable";
import {
  AddDiscipleForm,
  EditDiscipleForm,
  MoveDiscipleForm,
} from "./components/DiscipleForms";

/* ---------- 右键菜单项配置 ---------- */
const contextMenuItems: ContextMenuItem[] = [
  { label: "编辑弟子信息", action: "edit", permission: MEMBER_PERMISSIONS.UPDATE_ROLE, icon: "✏️" },
  { label: "移动门派", action: "move_peak", permission: PEAK_PERMISSIONS.MANAGE_MEMBERS, icon: "🚪" },
  { label: "删除弟子", action: "delete", permission: MEMBER_PERMISSIONS.EXPEL, icon: "🗑️" },
];

/** 旋转画廊统一青绿色调 */
const GALLERY = {
  bg: "linear-gradient(160deg, #F0FDFA 0%, #CCFBF1 100%)",
  bgActive: "linear-gradient(160deg, #ECFDF5 0%, #99F6E4 100%)",
  border: "#0D9488",
  borderActive: "#0F766E",
  text: "#134E4A",
  textSub: "#0F766E",
  accent: "#14B8A6",
  accentLight: "#5EEAD4",
  muted: "#94A3B8",
};

/** 默认峰排序（管理台优先） */
const DEFAULT_PEAK_ORDER = ["管理台", "算法峰", "项目峰", "电路峰"];

function getPeakOrder(peakName: string): number {
  const index = DEFAULT_PEAK_ORDER.indexOf(peakName);
  return index >= 0 ? index : DEFAULT_PEAK_ORDER.length;
}

/* ------------------------------------------------------------------ */
/*  页面组件                                                           */
/* ------------------------------------------------------------------ */
export default function SectAffairs() {
  const { hasPermission } = usePermission();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- 画廊状态 ---------- */
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef(0);

  /* ---------- 数据 ---------- */
  const [peaks, setPeaks] = useState<PeakInfo[]>([]);
  const [allDisciples, setAllDisciples] = useState<Disciple[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterPeak, setFilterPeak] = useState<SectPeak | "全部">("全部");

  /* ---------- 右键菜单 / 模态框 ---------- */
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    disciple: Disciple;
  } | null>(null);

  const [selectedDisciple, setSelectedDisciple] = useState<Disciple | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);

  const [showPeakModal, setShowPeakModal] = useState(false);
  const [currentPeak, setCurrentPeak] = useState<PeakInfo | null>(null);
  const [peakMembers, setPeakMembers] = useState<Disciple[]>([]);

  const [showCreatePeakModal, setShowCreatePeakModal] = useState(false);
  const [showDiscipleModal, setShowDiscipleModal] = useState(false);
  const [showRolePermissionModal, setShowRolePermissionModal] = useState(false);
  const [newPeakName, setNewPeakName] = useState("");
  const [newPeakDesc, setNewPeakDesc] = useState("");
  const [peakFormError, setPeakFormError] = useState("");

  const [formData, setFormData] = useState<{
    name: string;
    studentId: string;
    role: SectRole;
    peak: SectPeak | "无";
  }>({
    name: "",
    studentId: "",
    role: "外门弟子",
    peak: "项目峰",
  });
  const [moveTargetPeak, setMoveTargetPeak] = useState<SectPeak>("项目峰");
  const [formError, setFormError] = useState("");

  /* ---------- 辅助 ---------- */
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
    } catch (error) {
      console.error("Failed to load data:", error);
      showToast("数据加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  /* ---------- 弟子名册：响应搜索/筛选 ---------- */
  useEffect(() => {
    let ignore = false;
    async function fetchDisciples() {
      try {
        let data: Disciple[];
        if (searchKeyword) data = await sectApi.searchDisciples(searchKeyword);
        else if (filterPeak !== "全部") data = await sectApi.filterDisciplesByPeak(filterPeak);
        else data = await sectApi.getAllDisciples();
        if (!ignore) setAllDisciples(data);
      } catch (error) {
        console.error("Failed to load disciples:", error);
      }
    }
    fetchDisciples();
    return () => { ignore = true; };
  }, [searchKeyword, filterPeak]);

  /* ---------- 移动端检测 ---------- */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ---------- 准备画廊卡片数据（按指定顺序） ---------- */
  // 只有拥有 system:admin 权限的用户才能看到"管理台"卡片
  const canManagePermissions = hasPermission(SYSTEM_PERMISSIONS.ADMIN);
  const sortedPeaks = [...peaks]
    .filter((p) => p.name !== "管理台" || canManagePermissions)
    .sort((a, b) => {
      return getPeakOrder(a.name) - getPeakOrder(b.name);
    });
  const showAddCard =
    hasPermission(PEAK_PERMISSIONS.CREATE_DISBAND) || hasPermission(MEMBER_PERMISSIONS.UPDATE_ROLE);
  const totalCards = sortedPeaks.length + (showAddCard ? 1 : 0);

  /* ---------- 旋转控制 ---------- */
  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => Math.min(totalCards - 1, prev + 1));
  }, [totalCards]);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  }, []);

  /* ---------- 触摸滑动 ---------- */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const end = e.changedTouches[0].clientX;
    const diff = touchStartX.current - end;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  /* ---------- 卡片样式（等距排列） ---------- */
  const getCardStyle = (index: number): React.CSSProperties => {
    if (isMobile) return {};
    const offset = index - activeIndex;
    const abs = Math.abs(offset);
    const spacing = 320;
    const translateX = offset * spacing;
    const scale = Math.max(0.6, 1 - abs * 0.15);
    const opacity = abs > 2.6 ? 0 : Math.max(0.25, 1 - abs * 0.28);
    return {
      transform: `translateX(${translateX}px) scale(${scale})`,
      opacity,
      zIndex: abs * 10,
      transition: "transform 0.65s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.5s ease, box-shadow 0.4s ease",
      pointerEvents: "auto",
      filter: abs > 0 ? `brightness(${1 - abs * 0.08})` : "none",
    };
  };

  /* ---------- 卡片点击 ---------- */
  const handleCardClick = (index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
      return;
    }
    if (index < sortedPeaks.length) {
      handlePeakClick(sortedPeaks[index]);
    } else if (showAddCard) {
      if (hasPermission(PEAK_PERMISSIONS.CREATE_DISBAND)) {
        setShowCreatePeakModal(true);
        setNewPeakName("");
        setNewPeakDesc("");
        setPeakFormError("");
      } else if (hasPermission(MEMBER_PERMISSIONS.UPDATE_ROLE)) {
        handleAddDiscipleClick();
      }
    }
  };

  /* ---------- 打开峰详情 ---------- */
  async function handlePeakClick(peak: PeakInfo) {
    // 管理台：仅拥有 system:admin 权限的用户可打开权力调整窗口
    if (peak.name === "管理台" && canManagePermissions) {
      setShowRolePermissionModal(true);
      return;
    }
    setCurrentPeak(peak);
    try {
      const members = await sectApi.getDisciplesByPeak(peak.name as SectPeak);
      setPeakMembers(members);
    } catch (error) {
      console.error("Failed to load peak members:", error);
      setPeakMembers([]);
    }
    setShowPeakModal(true);
  }

  /* ---------- 创建新峰 ---------- */
  async function handleCreatePeak() {
    // 前端权限校验
    if (!canCreatePeak) {
      showToast("您没有创建峰的权限", "error");
      return;
    }
    setPeakFormError("");
    const trimmedName = newPeakName.trim();
    if (!trimmedName) {
      setPeakFormError("峰名称不能为空");
      return;
    }
    if (trimmedName.length > 20) {
      setPeakFormError("峰名称长度不能超过20个字符");
      return;
    }
    if (peaks.some((p) => p.name === trimmedName)) {
      setPeakFormError("该峰已存在");
      return;
    }
    setActionLoading(true);
    try {
      await sectApi.addPeak(trimmedName, newPeakDesc);
      showToast(`开辟新峰成功：${trimmedName}`, "success");
      setShowCreatePeakModal(false);
      await loadAllData();
    } catch (err) {
      setPeakFormError(err instanceof Error ? err.message : "创建峰失败");
    } finally {
      setActionLoading(false);
    }
  }

  /* ---------- 右键菜单 ---------- */
  function handleContextMenu(e: React.MouseEvent, disciple: Disciple) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, disciple });
  }

  function handleMenuAction(action: string) {
    if (!contextMenu) return;
    const disciple = contextMenu.disciple;
    setSelectedDisciple(disciple);

    // 操作前再次校验权限，防止通过控制台绕过前端UI限制
    switch (action) {
      case "edit":
        if (!canEditDisciple) {
          showToast("您没有编辑弟子的权限", "error");
          return;
        }
        setFormData({
          name: disciple.name,
          studentId: disciple.studentId,
          role: disciple.role,
          peak: disciple.peak,
        });
        setFormError("");
        setShowEditModal(true);
        break;
      case "move_peak":
        if (!canMoveDisciple) {
          showToast("您没有移动弟子的权限", "error");
          return;
        }
        setMoveTargetPeak(disciple.peak as SectPeak);
        setShowMoveModal(true);
        break;
      case "delete":
        if (!canDeleteDisciple) {
          showToast("您没有删除弟子的权限", "error");
          return;
        }
        handleDeleteDisciple(disciple);
        break;
    }
  }

  async function handleDeleteDisciple(disciple: Disciple) {
    // 前端权限校验
    if (!canDeleteDisciple) {
      showToast("您没有删除弟子的权限", "error");
      return;
    }
    if (!confirm(`确定要删除弟子 ${disciple.name} 吗？此操作不可撤销。`)) return;
    setActionLoading(true);
    try {
      const success = await sectApi.deleteDisciple(disciple.id);
      if (success) {
        showToast(`已删除弟子 ${disciple.name}`, "success");
        await loadAllData();
      }
    } catch {
      showToast("删除失败", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMoveSubmit() {
    if (!selectedDisciple) return;
    // 前端权限校验
    if (!canMoveDisciple) {
      showToast("您没有移动弟子的权限", "error");
      return;
    }
    setActionLoading(true);
    try {
      const success = await sectApi.moveDisciplePeak(selectedDisciple.id, moveTargetPeak);
      if (success) {
        showToast(`已将 ${selectedDisciple.name} 移至 ${moveTargetPeak}`, "success");
        setShowMoveModal(false);
        await loadAllData();
      }
    } catch {
      showToast("移动失败", "error");
    } finally {
      setActionLoading(false);
    }
  }

  function handleAddDiscipleClick() {
    // 前端权限校验
    if (!canAddDisciple) {
      showToast("您没有添加弟子的权限", "error");
      return;
    }
    setFormData({ name: "", studentId: "", role: "外门弟子", peak: "项目峰" });
    setFormError("");
    setShowAddModal(true);
  }

  async function handleAddSubmit() {
    // 前端权限校验
    if (!canAddDisciple) {
      showToast("您没有添加弟子的权限", "error");
      return;
    }
    setFormError("");

    // ---------- 表单验证 ----------
    const name = formData.name.trim();
    if (!name) {
      setFormError("弟子姓名不能为空");
      return;
    }
    if (name.length < 2 || name.length > 20) {
      setFormError("弟子姓名长度需在 2-20 个字符之间");
      return;
    }

    // 学号格式验证（选填，但填写时需校验格式）
    const studentId = formData.studentId.trim();
    if (studentId && !/^[a-zA-Z0-9_-]{3,20}$/.test(studentId)) {
      setFormError("学号格式不正确（支持字母、数字、下划线、连字符，长度 3-20）");
      return;
    }

    // 角色验证
    const validRoles: SectRole[] = ["外门弟子", "内门弟子", "长老", "荣誉长老", "太上长老", "大长老", "宗主"];
    if (!validRoles.includes(formData.role)) {
      setFormError("请选择有效的担当角色");
      return;
    }

    // 山峰验证
    const validPeaks = peaks.map((p: any) => p.name);
    if (formData.peak !== "无" && !validPeaks.includes(formData.peak as string)) {
      setFormError("所选山峰不存在或无效");
      return;
    }

    setActionLoading(true);
    try {
      // 调用后端添加弟子接口，后端将自动创建用户账号 + 弟子记录
      const result = await sectApi.addDisciple({
        name,
        studentId,
        role: formData.role as any,
        peak: formData.peak as any,
        joinedAt: new Date().toISOString(),
      });

      // 成功反馈
      const defaultPassword = "123456";
      showToast(
        `弟子 "${name}" 添加成功！已自动创建账号，默认密码：${defaultPassword}`,
        "success"
      );
      setShowAddModal(false);
      setFormData({ name: "", studentId: "", role: "外门弟子", peak: "项目峰" });
      await loadAllData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "添加失败，请稍后重试";
      setFormError(msg);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEditSubmit() {
    if (!selectedDisciple) return;
    // 前端权限校验
    if (!canEditDisciple) {
      showToast("您没有编辑弟子的权限", "error");
      return;
    }
    setFormError("");
    if (!formData.name.trim()) {
      setFormError("弟子姓名不能为空");
      return;
    }
    setActionLoading(true);
    try {
      await sectApi.updateDisciple(selectedDisciple.id, {
        name: formData.name,
        studentId: formData.studentId,
        role: formData.role,
        peak: formData.peak as SectPeak,
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

  /* ---------- 权限 ---------- */
  const hasManagePermission =
    hasPermission(MEMBER_PERMISSIONS.UPDATE_ROLE) || hasPermission(MEMBER_PERMISSIONS.EXPEL);
  const canAddDisciple = hasPermission(MEMBER_PERMISSIONS.UPDATE_ROLE);
  const canDeleteDisciple = hasPermission(MEMBER_PERMISSIONS.EXPEL);
  const canMoveDisciple = hasPermission(PEAK_PERMISSIONS.MANAGE_MEMBERS);
  const canEditDisciple = hasPermission(MEMBER_PERMISSIONS.UPDATE_ROLE);
  const canCreatePeak = hasPermission(PEAK_PERMISSIONS.CREATE_DISBAND);

  /* ---------- 加载中 ---------- */
  if (loading) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: "#93c1a8" }}
      >
        <div className="text-gray-500 text-lg font-shan">加载中...</div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  主视图                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div
      className="flex-1 py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-72px)]"
      style={{
        background: `
          linear-gradient(rgba(147, 193, 168, 0.4), rgba(147, 193, 168, 0.6)),
          url('/backgz.jpg') center / cover no-repeat,
          radial-gradient(ellipse at top left, rgba(255, 245, 230, 0.5) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(255, 240, 220, 0.4) 0%, transparent 50%)
        `,
        backgroundColor: '#93c1a8',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* ========== 页头 ========== */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#1a4a3a" }}>宗门事务</h1>
            <p className="text-sm mt-1" style={{ color: "#5a7a6a" }}>
              旋转卷轴浏览诸峰，点击卡片查看峰内详情
            </p>
          </div>
          <div className="text-xs hidden sm:flex items-center gap-3" style={{ color: "#5a7a6a" }}>
            <span className="text-gray-400">·</span>
            <span>共 {totalCards - 1} 页</span>
          </div>
        </div>

        {/* ========== 画廊 ========== */}
        <div
          className="relative mb-16"
          style={{ height: isMobile ? "auto" : "680px" }}
        >
          {/* 卷轴底纹 */}
          {!isMobile && (
            <div
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, transparent 0%, rgba(13, 148, 136, 0.06) 20%, rgba(13, 148, 136, 0.12) 50%, rgba(148, 49, 13, 0.06) 80%, transparent 100%)",
                borderRadius: "999px",
              }}
            />
          )}

          {/* 峰详情模态框 */}
          <PeakModal
            isOpen={showPeakModal}
            peak={currentPeak}
            members={peakMembers}
            onClose={() => setShowPeakModal(false)}
            onContextMenu={handleContextMenu}
          />

          {/* 角色权力调整模态框（管理台专属） */}
          {currentUser && (
            <RolePermissionModal
              isOpen={showRolePermissionModal}
              onClose={() => setShowRolePermissionModal(false)}
              currentUserRole={currentUser.role}
              hasManagePermission={canManagePermissions}
            />
          )}

          {/* 移动端：横向滑动列表 */}
          {isMobile ? (
            <div
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {sortedPeaks.map((peak) => (
                <PeakCard
                  key={peak.name}
                  peak={peak}
                  index={0}
                  activeIndex={0}
                  onClick={() => handlePeakClick(peak)}
                  isMobile
                />
              ))}

              {showAddCard && (
                <AddCard
                  index={0}
                  activeIndex={0}
                  onClick={() => handleCardClick(sortedPeaks.length)}
                  hasCreatePermission={canCreatePeak}
                  hasAddPermission={canAddDisciple}
                  isMobile
                />
              )}
            </div>
          ) : (
            /* 桌面端：等距排列画廊 */
            <div
              ref={carouselRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative w-full h-full"
              style={{ overflow: "hidden" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {sortedPeaks.map((peak, index) => (
                  <PeakCard
                    key={peak.name}
                    peak={peak}
                    index={index}
                    activeIndex={activeIndex}
                    onClick={() => handleCardClick(index)}
                    cardStyle={getCardStyle(index)}
                  />
                ))}
                {showAddCard && (
                  <AddCard
                    index={sortedPeaks.length}
                    activeIndex={activeIndex}
                    onClick={() => handleCardClick(sortedPeaks.length)}
                    hasCreatePermission={canCreatePeak}
                    hasAddPermission={canAddDisciple}
                    cardStyle={getCardStyle(sortedPeaks.length)}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========== 弟子名册入口 ========== */}
        <div className="mt-12">
          <div
            onClick={() => setShowDiscipleModal(true)}
            className="w-full cursor-pointer rounded-2xl p-5 flex items-center justify-between transition-all hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, rgba(15, 118, 110, 0.1) 0%, rgba(20, 184, 166, 0.15) 100%)",
              border: "1.5px solid rgba(15, 118, 110, 0.25)",
              boxShadow: "0 4px 15px -3px rgba(15, 118, 110, 0.2)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: "rgba(15, 118, 110, 0.12)" }}
              >
                📋
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#1a4a3a" }}>弟子名册</h2>
                <p className="text-sm mt-0.5" style={{ color: "#5a7a6a" }}>
                  管理宗门所有弟子信息 · 点击查看全部
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: "rgba(15, 118, 110, 0.12)", color: "#0D9488" }}
              >
                共 {allDisciples.length} 名弟子
              </span>
              <span style={{ color: "#0D9488", fontSize: "1.2rem" }}>→</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- 右键菜单（根据权限过滤菜单项） ---------- */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems.filter((item) => {
            if (!item.permission) return true;
            // 使用权限常量进行判断
            if (item.permission === MEMBER_PERMISSIONS.UPDATE_ROLE) return canEditDisciple;
            if (item.permission === PEAK_PERMISSIONS.MANAGE_MEMBERS) return canMoveDisciple;
            if (item.permission === MEMBER_PERMISSIONS.EXPEL) return canDeleteDisciple;
            return true;
          })}
          onSelect={handleMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* ---------- 创建峰弹窗 ---------- */}
      {showCreatePeakModal && (
        <Modal
          isOpen={showCreatePeakModal}
          onClose={() => setShowCreatePeakModal(false)}
          title="开辟新峰"
        >
          <div className="space-y-5">
            {peakFormError && (
              <div className="text-red-600 text-sm px-4 py-2.5 rounded-lg border border-red-200" style={{ backgroundColor: "rgba(254, 226, 226, 0.6)" }}>
                {peakFormError}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F766E" }}>
                峰名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newPeakName}
                onChange={(e) => setNewPeakName(e.target.value)}
                placeholder="请输入自定义峰名称（如：剑修峰、炼丹峰等）"
                className="w-full px-4 py-2.5 border-2 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm transition-all"
                style={{ borderColor: "rgba(15, 118, 110, 0.25)" }}
                maxLength={20}
              />
              <p className="text-xs text-gray-400 mt-1">{newPeakName.length}/20 字符</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F766E" }}>
                峰描述
              </label>
              <textarea
                value={newPeakDesc}
                onChange={(e) => setNewPeakDesc(e.target.value)}
                rows={3}
                placeholder="请输入峰的描述信息（选填）..."
                className="w-full px-4 py-2.5 border-2 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm resize-none transition-all"
                style={{ borderColor: "rgba(15, 118, 110, 0.25)" }}
              />
            </div>
            <div className="rounded-xl p-3.5 border" style={{ background: "rgba(15, 118, 110, 0.05)", borderColor: "rgba(15, 118, 110, 0.15)" }}>
              <p className="font-semibold text-sm mb-1" style={{ color: "#0F766E" }}>📝 操作说明</p>
              <p className="text-xs" style={{ color: "#5a7a6a" }}>开辟新峰将创建一个新的门派分支，可在其中管理弟子。峰创建后可在"角色权力调整"中分配管理员权限。</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreatePeakModal(false)}
                className="flex-1 px-4 py-2.5 border-2 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                style={{ borderColor: "rgba(15, 118, 110, 0.3)" }}
              >
                取消
              </button>
              <button
                onClick={handleCreatePeak}
                disabled={actionLoading || !newPeakName.trim()}
                className="flex-1 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: newPeakName.trim()
                    ? "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)"
                    : "#94A3B8",
                  boxShadow: newPeakName.trim() ? "0 4px 12px rgba(15, 118, 110, 0.25)" : "none",
                }}
              >
                {actionLoading ? "创建中..." : "确认开辟"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- 弟子名册弹窗 ---------- */}
      <Modal
        isOpen={showDiscipleModal}
        onClose={() => setShowDiscipleModal(false)}
        title="弟子名册"
        size="xl"
      >
        <DiscipleTable
          disciples={allDisciples}
          searchKeyword={searchKeyword}
          filterPeak={filterPeak}
          onSearchChange={setSearchKeyword}
          onFilterChange={setFilterPeak}
          onContextMenu={handleContextMenu}
          hasManagePermission={hasManagePermission}
          canMoveDisciple={canMoveDisciple}
          canDeleteDisciple={canDeleteDisciple}
          canAddDisciple={canAddDisciple}
          onAddDiscipleClick={handleAddDiscipleClick}
          // 过滤掉"管理台"（系统控制面板）和"_TREASURY_"（财务特殊峰，持久化容器）
          peaks={peaks.filter((p) => p.name !== "管理台" && p.name !== "_TREASURY_").map((p) => p.name)}
          onMove={(disciple) => {
            setSelectedDisciple(disciple);
            setMoveTargetPeak(disciple.peak as SectPeak);
            setShowMoveModal(true);
          }}
          onDelete={handleDeleteDisciple}
        />
      </Modal>

      {/* ---------- 表单模态框 ---------- */}
      <AddDiscipleForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleAddSubmit}
        error={formError}
        isLoading={actionLoading}
        // 过滤掉"管理台"（系统控制面板，不是业务峰）
        peaks={peaks.filter((p) => p.name !== "管理台").map((p) => p.name)}
      />

      <EditDiscipleForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        disciple={selectedDisciple}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleEditSubmit}
        error={formError}
        isLoading={actionLoading}
        peaks={peaks.filter((p) => p.name !== "管理台").map((p) => p.name)}
      />

      <MoveDiscipleForm
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        disciple={selectedDisciple}
        targetPeak={moveTargetPeak}
        onTargetPeakChange={setMoveTargetPeak}
        onSubmit={handleMoveSubmit}
        isLoading={actionLoading}
        peaks={peaks.filter((p) => p.name !== "管理台").map((p) => p.name)}
      />

      {/* ---------- Toast ---------- */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white font-medium z-50 font-shan ${toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          style={{
            backdropFilter: "blur(8px)",
            boxShadow: toast.type === "success"
              ? "0 10px 25px -5px rgba(16, 185, 129, 0.4)"
              : "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}