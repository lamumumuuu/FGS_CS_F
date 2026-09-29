// app/auth/page.tsx

/**
 * 认证页面（登录/注册合并）
 * 
 * 全屏认证界面，采用米白色系设计风格。
 * 通过选项卡在登录与注册模式间无缝切换，保持原有功能接口、数据验证逻辑及用户体验不变。
 *
 * 动画效果：
 * - 红色指示线平滑移动：切换登录/注册时，红色下划线使用 CSS transition 实现平滑滑动
 * - 表单丝滑弹出：切换模式时，表单使用 CSS 动画实现平滑展开效果，窗口平滑向下拓展
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { userApi } from "@/app/api/client";
import { usePermission } from "@/contexts/PermissionContext";
import { useNavTransition } from "@/hooks/useNavTransition";
import { siteConfig } from "@/siteConfig";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  页面组件                                                           */
/* ------------------------------------------------------------------ */
export default function AuthPage() {
  const router = useRouter();
  const { refreshPermissions } = usePermission();
  const { navigate } = useNavTransition();

  /* ---------- 模式切换 ---------- */
  type AuthMode = "login" | "register";
  const [mode, setMode] = useState<AuthMode>("login");

  // 动画状态控制
  const [showForm, setShowForm] = useState(true);
  const [animating, setAnimating] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  /* ---------- 登录表单状态 ---------- */
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  /* ---------- 注册表单状态 ---------- */
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [peak, setPeak] = useState("无");

  /* ---------- 通用状态 ---------- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------- 表单验证错误 ---------- */
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  /* ---------- 打字机效果 ---------- */
  // 副标题文本：登录和注册模式下分别展示不同内容
  const subtitleText = mode === "login" ? "一入万界，修行不止" : "落下道号，自此入界";
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typewriterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 启动打字机效果
   * 逐字显示副标题文本，每个字符间隔 100ms
   * 在切换登录/注册状态或进入页面时触发
   */
  const startTypewriter = useCallback((text: string) => {
    // 清除之前的定时器
    if (typewriterTimerRef.current) {
      clearTimeout(typewriterTimerRef.current);
    }
    setTypedText("");
    setIsTyping(true);

    let currentIndex = 0;
    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setTypedText(text.substring(0, currentIndex + 1));
        currentIndex++;
        typewriterTimerRef.current = setTimeout(typeNextChar, 100);
      } else {
        setIsTyping(false);
      }
    };
    typewriterTimerRef.current = setTimeout(typeNextChar, 200);
  }, []);

  // 页面首次加载时启动打字机效果
  useEffect(() => {
    startTypewriter(subtitleText);
    return () => {
      if (typewriterTimerRef.current) {
        clearTimeout(typewriterTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 更新指示器位置（红色指示线）
   * 根据当前模式计算指示器的 left 和 width，实现平滑移动
   */
  const updateIndicator = (currentMode: AuthMode) => {
    const index = currentMode === "login" ? 0 : 1;
    const tabElement = tabRefs.current[index];
    if (tabElement) {
      const { offsetLeft, offsetWidth } = tabElement;
      setIndicatorStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
        opacity: 1,
        transform: "translateX(0)",
      });
    }
  };

  // 初始化指示器位置
  useEffect(() => {
    updateIndicator(mode);
  }, [mode]);

  // 窗口大小变化时更新指示器位置
  useEffect(() => {
    const handleResize = () => {
      updateIndicator(mode);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mode]);

  /**
   * 切换模式的动画处理
   * 先播放收起动画，再切换模式，然后播放展开动画
   * 动画持续时间为800ms，确保丝滑流畅
   * 同时重新启动打字机效果
   */
  const handleModeSwitch = (newMode: AuthMode) => {
    if (mode === newMode || animating) return;

    setAnimating(true);
    setError("");
    setUsernameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // 先隐藏表单（丝滑收起）
    setShowForm(false);

    // 等待收起动画完成后切换模式（总动画时长800ms的一半 = 400ms）
    setTimeout(() => {
      setMode(newMode);
      // 切换模式后重新启动打字机效果
      const newSubtitle = newMode === "login" ? "一入万界，修行不止" : "落下道号，自此入界";
      startTypewriter(newSubtitle);
      // 显示表单（丝滑展开）
      setTimeout(() => {
        setShowForm(true);
        setAnimating(false);
      }, 50);
    }, 400); // 等待收起动画完成（约400ms，为800ms总时长的一半）
  };

  /* ------------------------------------------------------------------ */
  /*  表单验证                                                          */
  /* ------------------------------------------------------------------ */

  /** 验证用户名 */
  function validateUsername(value: string): string {
    if (!value.trim()) return "请输入用户名";
    if (value.length < 2) return "用户名至少2个字符";
    if (value.length > 20) return "用户名最多20个字符";
    return "";
  }

  /** 验证邮箱（两侧账号唯一标识，注册必填） */
  function validateEmail(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "请输入邮箱";
    if (trimmed.length > 100) return "邮箱最多100个字符";
    // 与后端 @Email 校验保持一致的基础格式校验
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "邮箱格式不正确";
    return "";
  }

  /** 验证密码 */
  function validatePassword(value: string): string {
    if (!value) return "请输入密码";
    if (value.length < 6) return "密码至少6个字符";
    if (value.length > 20) return "密码最多20个字符";
    return "";
  }

  /** 验证确认密码 */
  function validateConfirmPassword(value: string, passwordVal: string): string {
    if (!value) return "请再次输入密码";
    if (value !== passwordVal) return "两次输入的密码不一致";
    return "";
  }

  /** 验证登录账号（用户名或邮箱）：官网注册用户只知邮箱，故登录侧需同时接受两种标识 */
  function validateLoginAccount(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "请输入用户名或邮箱";
    if (trimmed.length > 100) return "账号最多100个字符";
    if (trimmed.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "邮箱格式不正确";
    return "";
  }

  /** 验证登录密码：只要求非空（官网注册的密码长度不受旧项目注册策略约束） */
  function validateLoginPassword(value: string): string {
    if (!value) return "请输入密码";
    return "";
  }

  /* ------------------------------------------------------------------ */
  /*  登录处理                                                          */
  /* ------------------------------------------------------------------ */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const uErr = validateLoginAccount(loginUsername);
    const pErr = validateLoginPassword(loginPassword);
    setUsernameError(uErr);
    setPasswordError(pErr);
    if (uErr || pErr) return;

    setLoading(true);
    // 先启动云雾聚拢动画，聚拢完成后再执行登录API调用，最后跳转
    navigate("/", async () => {
      try {
        await userApi.login({ username: loginUsername, password: loginPassword });
        await refreshPermissions();
      } catch (err) {
        setError(err instanceof Error ? err.message : "登录失败");
        throw err; // 抛出异常取消跳转，进入云雾消散阶段
      } finally {
        setLoading(false);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  注册处理                                                          */
  /* ------------------------------------------------------------------ */
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const uErr = validateUsername(regUsername);
    const eErr = validateEmail(regEmail);
    const pErr = validatePassword(regPassword);
    const cpErr = validateConfirmPassword(regConfirmPassword, regPassword);
    setUsernameError(uErr);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmPasswordError(cpErr);
    if (uErr || eErr || pErr || cpErr) return;

    setLoading(true);
    try {
      await userApi.register({ username: regUsername, password: regPassword, email: regEmail.trim(), studentId, peak });
      alert("注册成功，请登录");
      // 切换到登录模式
      handleModeSwitch("login");
      setRegUsername("");
      setRegEmail("");
      setRegPassword("");
      setRegConfirmPassword("");
      setStudentId("");
      setPeak("无");
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  渲染                                                              */
  /* ------------------------------------------------------------------ */
  return (
    // 双色扰动动态背景 + 纸质纹理叠加
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "#eae5dc" }}
    >
      {/* 动态双色背景层：3个模糊色块缓慢漂移，形成自然扰动融合效果 */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />
      {/* 纸质纹理叠加层（保持原有纸感） */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 30%, rgba(230, 226, 218, 0.5) 0%, transparent 40%),
            radial-gradient(circle at 85% 70%, rgba(223, 221, 215, 0.55) 0%, transparent 45%),
            radial-gradient(circle at 40% 85%, rgba(228, 224, 216, 0.4) 0%, transparent 35%),
            radial-gradient(circle at 70% 15%, rgba(225, 223, 217, 0.45) 0%, transparent 40%),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 1.5px,
              rgba(180, 160, 130, 0.08) 1.5px,
              rgba(180, 160, 130, 0.08) 2.5px
            );
          `,
        }}
      />

      <div className="w-full max-w-md relative" style={{ zIndex: 10 }}>
        {/* ---------- Logo 区域 ---------- */}
        <div className="text-center mb-8">
          <Link href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }} className="inline-block">
            <div className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden flex items-center justify-center">
              <Image
                src="/logo.png"
                alt={siteConfig.name}
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
          <span className="font-shan text-xl font-bold text-gray-800">
            <h1 className="text-7xl font-bold text-gray-800 mb-2">
              {siteConfig.name}
            </h1>
          </span>
          <span className="font-shan text-xl font-normal text-gray-700">
            <p className="text-red-700 min-h-[1.5em] flex items-center justify-center">
              <span>{typedText}</span>
              {/* 打字机光标：打字时闪烁，完成后持续闪烁 */}
              <span
                className="inline-block w-[2px] h-[1em] ml-1 bg-red-700"
                style={{
                  animation: "typewriter-cursor 0.8s step-end infinite",
                  opacity: isTyping ? 1 : 0.7,
                }}
              />
            </p>
          </span>
        </div>

        {/* ---------- 认证卡片（高度平滑过渡） ---------- */}
        <div
          className="w-full p-8"
          style={{
            backgroundColor: "#f5f1e4",
            border: "1px dashed #333",
            borderRadius: "0px",
            minHeight: mode === "login" ? "420px" : "700px",
            transition: "min-height 800ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* ---------- 选项卡切换（带动画指示器） ---------- */}
          <div ref={tabsRef} className="relative flex border-b border-gray-300 mb-6">
            <button
              ref={(el) => { tabRefs.current[0] = el; }}
              onClick={() => handleModeSwitch("login")}
              className={`flex-1 py-3 text-lg font-bold transition-colors ${mode === "login"
                ? "text-amber-700"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              登 录
            </button>
            <button
              ref={(el) => { tabRefs.current[1] = el; }}
              onClick={() => handleModeSwitch("register")}
              className={`flex-1 py-3 text-lg font-bold transition-colors ${mode === "register"
                ? "text-amber-700"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              注 册
            </button>
            {/* 红色指示线（800ms平滑移动） */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                height: "2px",
                backgroundColor: "#dc2626", // 红色指示线
                transition: "left 800ms cubic-bezier(0.4, 0, 0.2, 1), width 800ms cubic-bezier(0.4, 0, 0.2, 1), opacity 800ms ease",
                ...indicatorStyle,
              }}
            />
          </div>

          {/* ---------- 全局错误提示 ---------- */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              {error}
            </div>
          )}

          {/* ---------- 登录表单（带800ms丝滑弹出动画） ---------- */}
          <div
            style={{
              maxHeight: showForm ? "900px" : "0",
              opacity: showForm ? 1 : 0,
              overflow: "hidden",
              transition: "max-height 800ms cubic-bezier(0.4, 0, 0.2, 1), opacity 800ms ease",
            }}
          >
            {mode === "login" && showForm && (
              <form onSubmit={handleLogin} className="space-y-5 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">用户名 / 邮箱</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => {
                      setLoginUsername(e.target.value);
                      if (usernameError) setUsernameError(validateLoginAccount(e.target.value));
                    }}
                    onBlur={() => setUsernameError(validateLoginAccount(loginUsername))}
                    placeholder="请输入用户名或邮箱"
                    className={`w-full px-4 py-3 bg-transparent border border-dashed rounded-none focus:outline-none focus:ring-0 transition-all ${usernameError ? "border-red-400" : "border-[#cfc7ba]"
                      }`}
                    required
                  />
                  {usernameError && <p className="mt-1 text-xs text-red-500">{usernameError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (passwordError) setPasswordError(validateLoginPassword(e.target.value));
                    }}
                    onBlur={() => setPasswordError(validateLoginPassword(loginPassword))}
                    placeholder="请输入密码"
                    className={`w-full px-4 py-3 bg-transparent border border-dashed rounded-none focus:outline-none focus:ring-0 transition-all ${usernameError ? "border-red-400" : "border-[#cfc7ba]"
                      }`}
                    required
                  />
                  {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gray-800 text-white font-bold rounded-none shadow-md hover:bg-gray-900 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? "登录中..." : "登 录"}
                </button>
              </form>
            )}

            {/* ---------- 注册表单（带丝滑弹出动画） ---------- */}
            {mode === "register" && showForm && (
              <form onSubmit={handleRegister} className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => {
                      setRegUsername(e.target.value);
                      if (usernameError) setUsernameError(validateUsername(e.target.value));
                    }}
                    onBlur={() => setUsernameError(validateUsername(regUsername))}
                    placeholder="请输入用户名（2-20字符）"
                    className={`w-full px-4 py-3 bg-transparent border border-dashed rounded-none focus:outline-none focus:ring-0 transition-all ${usernameError ? "border-red-400" : "border-[#cfc7ba]"
                      }`}
                    required
                  />
                  {usernameError && <p className="mt-1 text-xs text-red-500">{usernameError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      if (emailError) setEmailError(validateEmail(e.target.value));
                    }}
                    onBlur={() => setEmailError(validateEmail(regEmail))}
                    placeholder="请输入邮箱（用于账号唯一标识）"
                    className={`w-full px-4 py-3 bg-transparent border border-dashed rounded-none focus:outline-none focus:ring-0 transition-all ${emailError ? "border-red-400" : "border-[#cfc7ba]"
                      }`}
                    required
                  />
                  {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">学号</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="请输入学号"
                    className="w-full px-4 py-3 bg-transparent border border-dashed border-[#cfc7ba] rounded-none focus:outline-none focus:ring-0 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">所属峰（选填）</label>
                  <select
                    value={peak}
                    onChange={(e) => setPeak(e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-dashed border-[#cfc7ba] rounded-none focus:outline-none focus:ring-0 transition-all"
                  >
                    <option value="无" style={{ backgroundColor: '#F5F3F0' }}>无</option>
                    <option value="项目峰" style={{ backgroundColor: '#F5F3F0' }}>项目峰</option>
                    <option value="算法峰" style={{ backgroundColor: '#F5F3F0' }}>算法峰</option>
                    <option value="电路峰" style={{ backgroundColor: '#F5F3F0' }}>电路峰</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (passwordError) setPasswordError(validatePassword(e.target.value));
                      if (confirmPasswordError) {
                        setConfirmPasswordError(validateConfirmPassword(regConfirmPassword, e.target.value));
                      }
                    }}
                    onBlur={() => setPasswordError(validatePassword(regPassword))}
                    placeholder="请输入密码（6-20字符）"
                    className={`w-full px-4 py-3 bg-transparent border border-dashed rounded-none focus:outline-none focus:ring-0 transition-all ${usernameError ? "border-red-400" : "border-[#cfc7ba]"
                      }`}
                    required
                  />
                  {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      if (confirmPasswordError) {
                        setConfirmPasswordError(validateConfirmPassword(e.target.value, regPassword));
                      }
                    }}
                    onBlur={() => setConfirmPasswordError(validateConfirmPassword(regConfirmPassword, regPassword))}
                    placeholder="请再次输入密码"
                    className={`w-full px-4 py-3 bg-transparent border border-dashed rounded-none focus:outline-none focus:ring-0 transition-all ${usernameError ? "border-red-400" : "border-[#cfc7ba]"
                      }`}
                    required
                  />
                  {confirmPasswordError && <p className="mt-1 text-xs text-red-500">{confirmPasswordError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gray-800 text-white font-bold rounded-none shadow-md hover:bg-gray-900 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? "注册中..." : "注 册"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ---------- 返回首页 ---------- */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            onClick={(e) => { e.preventDefault(); navigate("/"); }}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            ← 返回首页
          </Link>
        </div>
      </div>

      {/* 双色扰动动态背景动画样式 */}
      <style jsx>{`
        .auth-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          will-change: transform;
        }
        /* 色块1：右上方向漂移，主色调偏暖米色 */
        .auth-blob-1 {
          width: 55vw;
          height: 55vw;
          max-width: 700px;
          max-height: 700px;
          background: radial-gradient(circle, rgba(210, 180, 140, 0.85) 0%, transparent 65%);
          top: -15%;
          left: -10%;
          opacity: 0.75;
          animation: auth-drift-1 28s ease-in-out infinite;
        }
        /* 色块2：左下方向漂移，第二色（柔和鼠尾草绿） */
        .auth-blob-2 {
          width: 50vw;
          height: 50vw;
          max-width: 650px;
          max-height: 650px;
          background: radial-gradient(circle, rgba(100, 140, 125, 0.8) 0%, transparent 65%);
          bottom: -15%;
          right: -10%;
          opacity: 0.65;
          animation: auth-drift-2 35s ease-in-out infinite;
        }
        /* 色块3：中心区域漂移，两种颜色混合过渡 */
        .auth-blob-3 {
          width: 40vw;
          height: 40vw;
          max-width: 500px;
          max-height: 500px;
          background: radial-gradient(circle, rgba(160, 170, 140, 0.7) 0%, transparent 60%);
          top: 30%;
          left: 35%;
          opacity: 0.55;
          animation: auth-drift-3 22s ease-in-out infinite;
        }
        /* 三组关键帧使用不同的路径和缩放，形成自然的颜色融合扰动 */
        @keyframes auth-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(25vw, 15vh) scale(1.15); }
          50% { transform: translate(15vw, 35vh) scale(0.9); }
          75% { transform: translate(35vw, 10vh) scale(1.05); }
        }
        @keyframes auth-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          30% { transform: translate(-20vw, -20vh) scale(1.2); }
          60% { transform: translate(-35vw, -5vh) scale(0.95); }
          80% { transform: translate(-15vw, -30vh) scale(1.1); }
        }
        @keyframes auth-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          20% { transform: translate(-20vw, 18vh) scale(1.15); }
          40% { transform: translate(15vw, -12vh) scale(0.85); }
          60% { transform: translate(-10vw, -22vh) scale(1.1); }
          80% { transform: translate(22vw, 8vh) scale(0.95); }
        }
        /* 打字机光标闪烁动画 */
        @keyframes typewriter-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-blob { animation: none; }
        }
      `}</style>
    </div>
  );
}