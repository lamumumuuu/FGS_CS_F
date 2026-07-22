// app/sect-affairs/page.tsx

/**
 * 宗门事务页面
 * 
 * 展示宗门详情（实力分布）和弟子名册，支持搜索、筛选和右键菜单操作。
 * 包含弟子移动、打赏、删除等管理功能。
 * 采用米白色系设计风格，与整体 UI 保持一致。
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Disciple,
  PeakInfo,
  CurrentUser,
  SectPeak,
  ContextMenuItem,
} from "@/types/sect";
import { sectApi } from "@/app/api/client";
import DiscipleItem from "@/components/DiscipleItem";
import ContextMenu from "@/components/ContextMenu";
import Modal from "@/components/Modal";

type ViewMode = "detail" | "roster";

const contextMenuItems: ContextMenuItem[] = [
  { label: "设置弟子权限", action: "set_permission", permission: "manage_permissions", icon: "🔐" },
  { label: "移动门派", action: "move_peak", permission: "move_disciple", icon: "🚪" },
  { label: "打赏弟子", action: "reward", permission: "reward_disciple", icon: "💰" },
  { label: "删除弟子", action: "delete", permission: "delete_disciple", icon: "🗑️" },
];

/* ------------------------------------------------------------------ */
/*  页面组件                                                           */
/* ------------------------------------------------------------------ */
export default function SectAffairs() {
  const [viewMode, setViewMode] = useState<ViewMode>("detail");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [managementDisciples, setManagementDisciples] = useState<Disciple[]>([]);
  const [peaks, setPeaks] = useState<PeakInfo[]>([]);
  const [expandedManagement, setExpandedManagement] = useState(false);
  const [expandedPeak, setExpandedPeak] = useState<SectPeak | null>(null);
  const [peakMembers, setPeakMembers] = useState<Disciple[]>([]);

  const [allDisciples, setAllDisciples] = useState<Disciple[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterPeak, setFilterPeak] = useState<SectPeak | "全部">("全部");

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    disciple: Disciple;
  } | null>(null);

  const [showWipModal, setShowWipModal] = useState(false);
  const [wipTitle, setWipTitle] = useState("施工中");

  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(10);
  const [selectedDisciple, setSelectedDisciple] = useState<Disciple | null>(null);

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetPeak, setMoveTargetPeak] = useState<SectPeak>("项目峰");

  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ---------- 初始数据加载 ---------- */
  useEffect(() => {
    let ignore = false;
    async function fetchInitialData() {
      setLoading(true);
      try {
        const [user, peaksData, managementData] = await Promise.all([
          sectApi.getCurrentUser(),
          sectApi.getAllPeaks(),
          sectApi.getManagementDisciples(),
        ]);
        if (!ignore) {
          setCurrentUser(user);
          setPeaks(peaksData);
          setManagementDisciples(managementData);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        if (!ignore) showToast("数据加载失败", "error");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchInitialData();
    return () => { ignore = true; };
  }, [showToast]);

  /* ---------- 弟子列表加载 ---------- */
  useEffect(() => {
    if (viewMode !== "roster") return;
    let ignore = false;
    async function fetchDisciples() {
      try {
        let data: Disciple[];
        if (searchKeyword) {
          data = await sectApi.searchDisciples(searchKeyword);
        } else {
          data = await sectApi.filterDisciplesByPeak(filterPeak);
        }
        if (!ignore) setAllDisciples(data);
      } catch (error) {
        console.error("Failed to load disciples:", error);
      }
    }
    fetchDisciples();
    return () => { ignore = true; };
  }, [viewMode, searchKeyword, filterPeak]);

  async function handlePeakClick(peakName: SectPeak) {
    if (expandedPeak === peakName) {
      setExpandedPeak(null);
      setPeakMembers([]);
    } else {
      setExpandedPeak(peakName);
      try {
        const members = await sectApi.getDisciplesByPeak(peakName);
        setPeakMembers(members);
      } catch (error) {
        console.error("Failed to load peak members:", error);
      }
    }
  }

  function handleContextMenu(e: React.MouseEvent, disciple: Disciple) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, disciple });
  }

  function handleMenuAction(action: string) {
    if (!contextMenu) return;
    const disciple = contextMenu.disciple;
    setSelectedDisciple(disciple);

    switch (action) {
      case "set_permission":
        openWipModal("权限设置");
        break;
      case "move_peak":
        setMoveTargetPeak(disciple.peak === "项目峰" ? "算法峰" : "项目峰");
        setShowMoveModal(true);
        break;
      case "reward":
        setShowRewardModal(true);
        break;
      case "delete":
        handleDeleteDisciple(disciple);
        break;
    }
  }

  async function handleDeleteDisciple(disciple: Disciple) {
    if (!confirm(`确定要删除弟子 ${disciple.name} 吗？`)) return;

    setActionLoading(true);
    try {
      const success = await sectApi.deleteDisciple(disciple.id);
      if (success) {
        showToast(`已删除弟子 ${disciple.name}`, "success");
        setLoading(true);
        const [user, peaksData, managementData] = await Promise.all([
          sectApi.getCurrentUser(),
          sectApi.getAllPeaks(),
          sectApi.getManagementDisciples(),
        ]);
        setCurrentUser(user);
        setPeaks(peaksData);
        setManagementDisciples(managementData);
        setLoading(false);
        if (expandedPeak) {
          const members = await sectApi.getDisciplesByPeak(expandedPeak);
          setPeakMembers(members);
        }
      }
    } catch {
      showToast("删除失败", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRewardSubmit() {
    if (!selectedDisciple) return;
    setActionLoading(true);
    try {
      const success = await sectApi.rewardDisciple(selectedDisciple.id, rewardAmount);
      if (success) {
        showToast(`已打赏 ${selectedDisciple.name} ${rewardAmount} 灵石`, "success");
        setShowRewardModal(false);
      }
    } catch {
      showToast("打赏失败", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMoveSubmit() {
    if (!selectedDisciple) return;
    setActionLoading(true);
    try {
      const success = await sectApi.moveDisciplePeak(selectedDisciple.id, moveTargetPeak);
      if (success) {
        showToast(`已将 ${selectedDisciple.name} 移至 ${moveTargetPeak}`, "success");
        setShowMoveModal(false);
        setLoading(true);
        const [user, peaksData, managementData] = await Promise.all([
          sectApi.getCurrentUser(),
          sectApi.getAllPeaks(),
          sectApi.getManagementDisciples(),
        ]);
        setCurrentUser(user);
        setPeaks(peaksData);
        setManagementDisciples(managementData);
        setLoading(false);
        if (expandedPeak) {
          const members = await sectApi.getDisciplesByPeak(expandedPeak);
          setPeakMembers(members);
        }
      }
    } catch {
      showToast("移动失败", "error");
    } finally {
      setActionLoading(false);
    }
  }

  function openWipModal(title: string) {
    setWipTitle(title);
    setShowWipModal(true);
  }

  const hasPermission = (permission: string) => {
    return (currentUser?.permissions as string[])?.includes(permission) ?? false;
  };

  /* ------------------------------------------------------------------ */
  /*  加载中                                                             */
  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: "#F5F3F0" }}
      >
        <div className="text-gray-500 text-lg">加载中...</div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  渲染                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div
      className="flex-1 py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-72px)]"
      style={{
        backgroundColor: "#F5F3F0",
        backgroundImage: `
          radial-gradient(ellipse at top left, rgba(200, 180, 160, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(180, 160, 140, 0.06) 0%, transparent 50%)
        `,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* ---------- 页头 ---------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {viewMode === "detail" ? "宗门详情" : "弟子名册"}
            </h1>
            {viewMode === "roster" && (
              <p className="text-sm text-gray-500 mt-1">
                管理宗门所有弟子信息，支持搜索、筛选和批量操作
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {viewMode === "roster" && hasPermission("add_disciple") && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openWipModal("添加弟子")}
                  className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-none hover:bg-gray-900 transition-colors"
                >
                  ➕ 添加弟子
                </button>
                <button
                  onClick={() => openWipModal("批量导入")}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-none hover:bg-gray-50 transition-colors"
                >
                  📥 批量导入
                </button>
              </div>
            )}
            <button
              onClick={() => setViewMode(viewMode === "detail" ? "roster" : "detail")}
              className="px-5 py-2.5 bg-gray-800 text-white font-medium rounded-none hover:bg-gray-900 transition-all"
            >
              {viewMode === "detail" ? "📋 弟子名册" : "🏛️ 实力分布"}
            </button>
          </div>
        </div>

        {/* ---------- 视图：detail（实力分布） ---------- */}
        {viewMode === "detail" ? (
          <div className="space-y-6">
            {/* 管理台 */}
            <div
              className="rounded-none shadow-md border border-gray-300 overflow-hidden"
              style={{ backgroundColor: "#FAF9F7" }}
            >
              <div
                onClick={() => setExpandedManagement(!expandedManagement)}
                className="px-6 py-4 bg-gray-800 text-white cursor-pointer flex items-center justify-between hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏛️</span>
                  <div>
                    <h2 className="text-xl font-bold">管理台</h2>
                    <p className="text-sm text-gray-300">宗门高层管理团队</p>
                  </div>
                </div>
                <span className={`text-xl transition-transform ${expandedManagement ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </div>
              {expandedManagement && (
                <div className="p-4 space-y-2">
                  {managementDisciples.map((disciple) => (
                    <DiscipleItem
                      key={disciple.id}
                      disciple={disciple}
                      onContextMenu={handleContextMenu}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 各峰卡片网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {peaks.map((peak) => (
                <div
                  key={peak.name}
                  className="rounded-none shadow-md border border-gray-300 overflow-hidden"
                  style={{ backgroundColor: "#FAF9F7" }}
                >
                  <div
                    onClick={() => handlePeakClick(peak.name)}
                    className="px-6 py-4 bg-gray-700 text-white cursor-pointer flex items-center justify-between hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {peak.name === "项目峰" ? "🏗️" : peak.name === "算法峰" ? "🧮" : "⚡"}
                      </span>
                      <div>
                        <h2 className="text-xl font-bold">{peak.name}</h2>
                        <p className="text-sm text-gray-300">
                          {peak.memberCount} 名弟子
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xl transition-transform ${expandedPeak === peak.name ? "rotate-180" : ""}`}
                    >
                      ▼
                    </span>
                  </div>
                  <div className="px-6 py-3 text-sm text-gray-600 border-b border-gray-200">
                    {peak.description}
                  </div>
                  {expandedPeak === peak.name && (
                    <div className="p-4 space-y-2">
                      {peakMembers.length > 0 ? (
                        peakMembers.map((disciple) => (
                          <DiscipleItem
                            key={disciple.id}
                            disciple={disciple}
                            onContextMenu={handleContextMenu}
                            compact
                          />
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          暂无弟子
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* 开辟新峰 */}
              {hasPermission("manage_peaks") && (
                <div
                  onClick={() => openWipModal("开辟新峰")}
                  className="rounded-none border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gray-500 hover:bg-gray-50 transition-all min-h-[160px]"
                  style={{ backgroundColor: "#FAF9F7" }}
                >
                  <span className="text-4xl mb-3">⛰️</span>
                  <h3 className="text-lg font-bold text-gray-700">开辟新峰</h3>
                  <p className="text-sm text-gray-500 mt-1">创建新的门派分支</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ---------- 视图：roster（弟子名册） ---------- */
          <div
            className="rounded-none shadow-md border border-gray-300 overflow-hidden"
            style={{ backgroundColor: "#FAF9F7" }}
          >
            {/* 搜索筛选栏 */}
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜索弟子姓名或学号..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">门派：</span>
                <select
                  value={filterPeak}
                  onChange={(e) => setFilterPeak(e.target.value as SectPeak | "全部")}
                  className="px-3 py-2 border border-gray-300 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm cursor-pointer"
                >
                  <option value="全部">全部角色</option>
                  <option value="管理台">管理台</option>
                  <option value="项目峰">项目峰</option>
                  <option value="算法峰">算法峰</option>
                  <option value="电路峰">电路峰</option>
                </select>
              </div>
            </div>

            {/* 弟子表格 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      弟子名字
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      学号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      担当角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      所属门派
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allDisciples.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        暂无弟子数据
                      </td>
                    </tr>
                  ) : (
                    allDisciples.map((disciple) => (
                      <tr
                        key={disciple.id}
                        onContextMenu={(e) => handleContextMenu(e, disciple)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm border border-gray-300">
                              {disciple.name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-800">
                              {disciple.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {disciple.studentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-none text-xs font-medium border ${
                              disciple.role === "宗主"
                                ? "bg-purple-100 text-purple-700 border-purple-300"
                                : disciple.role === "大长老"
                                ? "bg-red-100 text-red-700 border-red-300"
                                : disciple.role === "太上长老"
                                ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                                : disciple.role === "荣誉长老"
                                ? "bg-amber-100 text-amber-700 border-amber-300"
                                : disciple.role === "长老"
                                ? "bg-blue-100 text-blue-700 border-blue-300"
                                : "bg-green-100 text-green-700 border-green-300"
                            }`}
                          >
                            {disciple.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {disciple.peak}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
              共 {allDisciples.length} 名弟子
            </div>
          </div>
        )}
      </div>

      {/* ---------- 右键菜单 ---------- */}
      {contextMenu && currentUser && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          currentUser={currentUser}
          onSelect={handleMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* ---------- 施工中弹窗 ---------- */}
      <Modal isOpen={showWipModal} onClose={() => setShowWipModal(false)} title={wipTitle}>
        <div className="text-center py-6">
          <div className="text-5xl mb-4">🏗️</div>
          <p className="text-gray-600">此功能正在建设中，敬请期待...</p>
        </div>
      </Modal>

      {/* ---------- 打赏弹窗 ---------- */}
      <Modal isOpen={showRewardModal} onClose={() => setShowRewardModal(false)} title="打赏弟子">
        {selectedDisciple && (
          <div className="space-y-4">
            <div
              className="flex items-center gap-3 p-3 rounded-none border border-gray-200"
              style={{ backgroundColor: "#FAF9F7" }}
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold border border-gray-300">
                {selectedDisciple.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-gray-800">{selectedDisciple.name}</div>
                <div className="text-sm text-gray-500">{selectedDisciple.peak}</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                打赏灵石数量
              </label>
              <input
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(Number(e.target.value))}
                min={1}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleRewardSubmit}
              disabled={actionLoading}
              className="w-full py-2.5 bg-gray-800 text-white font-medium rounded-none hover:bg-gray-900 transition-all disabled:opacity-50"
            >
              {actionLoading ? "处理中..." : "确认打赏"}
            </button>
          </div>
        )}
      </Modal>

      {/* ---------- 移动门派弹窗 ---------- */}
      <Modal isOpen={showMoveModal} onClose={() => setShowMoveModal(false)} title="移动门派">
        {selectedDisciple && (
          <div className="space-y-4">
            <div
              className="flex items-center gap-3 p-3 rounded-none border border-gray-200"
              style={{ backgroundColor: "#FAF9F7" }}
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold border border-gray-300">
                {selectedDisciple.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-gray-800">{selectedDisciple.name}</div>
                <div className="text-sm text-gray-500">当前门派：{selectedDisciple.peak}</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标门派
              </label>
              <select
                value={moveTargetPeak}
                onChange={(e) => setMoveTargetPeak(e.target.value as SectPeak)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="项目峰">项目峰</option>
                <option value="算法峰">算法峰</option>
                <option value="电路峰">电路峰</option>
              </select>
            </div>
            <button
              onClick={handleMoveSubmit}
              disabled={actionLoading}
              className="w-full py-2.5 bg-gray-800 text-white font-medium rounded-none hover:bg-gray-900 transition-all disabled:opacity-50"
            >
              {actionLoading ? "处理中..." : "确认移动"}
            </button>
          </div>
        )}
      </Modal>

      {/* ---------- Toast 提示 ---------- */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-none shadow-lg text-white font-medium z-50 ${
            toast.type === "success" ? "bg-green-700" : "bg-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
