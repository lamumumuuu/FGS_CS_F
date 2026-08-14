// app/sect-affairs/page.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SectPeak, PeakInfo } from "@/types/sect";
import ContextMenu from "@/app/sect-affairs/components/ContextMenu";
import SectModal from "./components/SectModal";
import { usePermission } from "@/contexts/PermissionContext";
import { MEMBER_PERMISSIONS, PEAK_PERMISSIONS } from "@/types/permissions";
import Gallery from "./components/Gallery";
import CreatePeakModal from "./components/CreatePeakModal";
import PeakModal from "./components/PeakModal";
import RolePermissionModal from "./components/RolePermissionModal";
import DiscipleTable from "./components/DiscipleTable";
import {
  AddDiscipleForm,
  EditDiscipleForm,
  MoveDiscipleForm,
} from "./components/DiscipleFormModals";
import { useSectAffairs } from "./components/useSectAffairs";

const contextMenuItems = [
  { label: "编辑弟子信息", action: "edit", permission: MEMBER_PERMISSIONS.UPDATE_ROLE, icon: "✏️" },
  { label: "移动门派", action: "move_peak", permission: PEAK_PERMISSIONS.MANAGE_MEMBERS, icon: "🚪" },
  { label: "删除弟子", action: "delete", permission: MEMBER_PERMISSIONS.EXPEL, icon: "🗑️" },
];

export default function SectAffairs() {
  const { hasPermission } = usePermission();

  const {
    currentUser,
    loading,
    peaks,
    allDisciples,
    searchKeyword,
    filterPeak,
    setSearchKeyword,
    setFilterPeak,
    showPeakModal,
    setShowPeakModal,
    currentPeak,
    peakMembers,
    showRolePermissionModal,
    setShowRolePermissionModal,
    showCreatePeakModal,
    setShowCreatePeakModal,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    showMoveModal,
    setShowMoveModal,
    selectedDisciple,
    setSelectedDisciple,
    formData,
    setFormData,
    moveTargetPeak,
    setMoveTargetPeak,
    formError,
    actionLoading,
    showDiscipleModal,
    setShowDiscipleModal,
    newPeakName,
    setNewPeakName,
    newPeakDesc,
    setNewPeakDesc,
    peakFormError,
    setPeakFormError,
    toast,
    contextMenu,
    setContextMenu,
    handlePeakClick,
    handleCreatePeak,
    handleDeleteDisciple,
    handleMoveSubmit,
    handleAddSubmit,
    handleEditSubmit,
    handleContextMenu,
    handleMenuAction,
    handleAddDiscipleClick,
    canManagePermissions,
    canAddDisciple,
    canDeleteDisciple,
    canMoveDisciple,
    canEditDisciple,
    canCreatePeak,
    hasManagePermission,
    sortedPeaks,
    showAddCard,
  } = useSectAffairs(hasPermission);

  const totalCards = sortedPeaks.length + (showAddCard ? 1 : 0);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef(0);

  const nextSlide = useCallback(
    () => setActiveIndex((prev) => Math.min(totalCards - 1, prev + 1)),
    [totalCards]
  );
  const prevSlide = useCallback(
    () => setActiveIndex((prev) => Math.max(0, prev - 1)),
    []
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#93c1a8" }}>
        <div className="text-gray-500 text-lg font-shan">加载中...</div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-72px)]"
      style={{
        background: `linear-gradient(rgba(147, 193, 168, 0.4), rgba(147, 193, 168, 0.6)), url('/backgz.jpg') center / cover no-repeat, radial-gradient(ellipse at top left, rgba(255, 245, 230, 0.5) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(255, 240, 220, 0.4) 0%, transparent 50%)`,
        backgroundColor: "#93c1a8",
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* 页头 */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#1a4a3a" }}>宗门事务</h1>
            <p className="text-sm mt-1" style={{ color: "#5a7a6a" }}>旋转卷轴浏览诸峰，点击卡片查看峰内详情</p>
          </div>
          <div className="text-xs hidden sm:flex items-center gap-3" style={{ color: "#5a7a6a" }}>
            <span className="text-gray-400">·</span><span>共 {totalCards - 1} 页</span>
          </div>
        </div>

        {/* 画廊 */}
        <Gallery
  peaks={sortedPeaks}
  activeIndex={activeIndex}
  setActiveIndex={setActiveIndex}
  onCardClick={(index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
      return;
    }
    if (index < sortedPeaks.length) {
      handlePeakClick(sortedPeaks[index]);
    } else if (showAddCard) {
      if (canCreatePeak) {
        setShowCreatePeakModal(true);
        setNewPeakName("");
        setNewPeakDesc("");
        setPeakFormError("");
      } else if (canAddDisciple) {
        handleAddDiscipleClick();
      }
    }
  }}
  showAddCard={showAddCard}
  canCreatePeak={canCreatePeak}
  canAddDisciple={canAddDisciple}
  isMobile={isMobile}
  carouselRef={carouselRef}
  handleTouchStart={handleTouchStart}
  handleTouchEnd={handleTouchEnd}
  totalCards={totalCards}
/>

        <PeakModal isOpen={showPeakModal} peak={currentPeak} members={peakMembers} onClose={() => setShowPeakModal(false)} onContextMenu={handleContextMenu} />
        {currentUser && <RolePermissionModal isOpen={showRolePermissionModal} onClose={() => setShowRolePermissionModal(false)} currentUserRole={currentUser.role} hasManagePermission={canManagePermissions} />}

        {/* 弟子名册入口 */}
        <div className="mt-12">
          <div onClick={() => setShowDiscipleModal(true)} className="w-full cursor-pointer rounded-2xl p-5 flex items-center justify-between transition-all hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, rgba(15, 118, 110, 0.1) 0%, rgba(20, 184, 166, 0.15) 100%)", border: "1.5px solid rgba(15, 118, 110, 0.25)", boxShadow: "0 4px 15px -3px rgba(15, 118, 110, 0.2)" }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: "rgba(15, 118, 110, 0.12)" }}>📋</div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#1a4a3a" }}>弟子名册</h2>
                <p className="text-sm mt-0.5" style={{ color: "#5a7a6a" }}>管理宗门所有弟子信息 · 点击查看全部</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: "rgba(15, 118, 110, 0.12)", color: "#0D9488" }}>共 {allDisciples.length} 名弟子</span>
              <span style={{ color: "#0D9488", fontSize: "1.2rem" }}>→</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y}
          items={contextMenuItems.filter(item => !item.permission || (item.permission === MEMBER_PERMISSIONS.UPDATE_ROLE ? canEditDisciple : item.permission === PEAK_PERMISSIONS.MANAGE_MEMBERS ? canMoveDisciple : item.permission === MEMBER_PERMISSIONS.EXPEL ? canDeleteDisciple : true))}
          onSelect={(action) => { handleMenuAction(action); setContextMenu(null); }}
          onClose={() => setContextMenu(null)} />
      )}

      <CreatePeakModal isOpen={showCreatePeakModal} onClose={() => setShowCreatePeakModal(false)}
        newPeakName={newPeakName} newPeakDesc={newPeakDesc} onNameChange={setNewPeakName} onDescChange={setNewPeakDesc}
        peakFormError={peakFormError} actionLoading={actionLoading} onCreate={handleCreatePeak} />

      <SectModal isOpen={showDiscipleModal} onClose={() => setShowDiscipleModal(false)} title="弟子名册" size="xl">
        <DiscipleTable disciples={allDisciples} searchKeyword={searchKeyword} filterPeak={filterPeak}
          onSearchChange={setSearchKeyword} onFilterChange={setFilterPeak} onContextMenu={handleContextMenu}
          hasManagePermission={hasManagePermission} canMoveDisciple={canMoveDisciple} canDeleteDisciple={canDeleteDisciple}
          canAddDisciple={canAddDisciple} onAddDiscipleClick={handleAddDiscipleClick}
          peaks={peaks.filter((p: PeakInfo) => p.name !== "管理台" && p.name !== "_TREASURY_").map((p: PeakInfo) => p.name)}
          onMove={(disciple) => { setSelectedDisciple(disciple); setMoveTargetPeak(disciple.peak as SectPeak); setShowMoveModal(true); }}
          onDelete={handleDeleteDisciple} />
      </SectModal>

      <AddDiscipleForm isOpen={showAddModal} onClose={() => setShowAddModal(false)} formData={formData} onFormChange={setFormData}
        onSubmit={handleAddSubmit} error={formError} isLoading={actionLoading}
        peaks={peaks.filter((p: PeakInfo) => p.name !== "管理台").map((p: PeakInfo) => p.name)} />

      <EditDiscipleForm isOpen={showEditModal} onClose={() => setShowEditModal(false)} disciple={selectedDisciple} formData={formData}
        onFormChange={setFormData} onSubmit={handleEditSubmit} error={formError} isLoading={actionLoading}
        peaks={peaks.filter((p: PeakInfo) => p.name !== "管理台").map((p: PeakInfo) => p.name)} />

      <MoveDiscipleForm isOpen={showMoveModal} onClose={() => setShowMoveModal(false)} disciple={selectedDisciple}
        targetPeak={moveTargetPeak} onTargetPeakChange={setMoveTargetPeak} onSubmit={handleMoveSubmit} isLoading={actionLoading}
        peaks={peaks.filter((p: PeakInfo) => p.name !== "管理台").map((p: PeakInfo) => p.name)} />

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white font-medium z-50 font-shan ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
          style={{ backdropFilter: "blur(8px)", boxShadow: toast.type === "success" ? "0 10px 25px -5px rgba(16, 185, 129, 0.4)" : "0 10px 25px -5px rgba(239, 68, 68, 0.4)" }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}