// app/announcement/components/LoadingState.tsx

/**
 * 加载状态骨架屏组件
 * 
 * 用于公告栏页面数据加载时的占位展示
 */

export default function LoadingState() {
  return (
    <div
      className="flex-1 flex items-center justify-center min-h-[calc(100vh-72px)]"
      style={{ backgroundColor: "#93c1a8" }}
    >
      <div className="text-xl font-shan" style={{ color: "#1a4a3a" }}>
        加载中...
      </div>
    </div>
  );
}