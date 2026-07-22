// app/register/page.tsx

/**
 * 注册页面
 * 
 * 全屏认证界面，与登录页保持统一的米白色系设计风格。
 * 功能：用户名密码注册、确认密码校验、学号选填、表单验证、错误提示。
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { userApi } from "@/app/api/client";
import { siteConfig } from "@/siteConfig";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  页面组件                                                           */
/* ------------------------------------------------------------------ */
export default function Register() {
  const router = useRouter();

  /* ---------- 表单状态 ---------- */
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [peak, setPeak] = useState("无");

  /* ---------- 表单验证错误 ---------- */
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

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

  /* ------------------------------------------------------------------ */
  /*  提交处理                                                          */
  /* ------------------------------------------------------------------ */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    /* ---------- 前端验证 ---------- */
    const uErr = validateUsername(username);
    const pErr = validatePassword(password);
    const cpErr = validateConfirmPassword(confirmPassword, password);
    setUsernameError(uErr);
    setPasswordError(pErr);
    setConfirmPasswordError(cpErr);
    if (uErr || pErr || cpErr) return;

    /* ---------- 提交注册 ---------- */
    setLoading(true);
    try {
      await userApi.register({ username, password, studentId, peak });
      alert("注册成功，请登录");
      router.push("/login");
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
    /* ---------- 全屏背景：米白色 ---------- */
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#F2F0ED" }}
    >
      <div className="w-full max-w-md">
        {/* ---------- Logo 区域 ---------- */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div
              className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden shadow-lg flex items-center justify-center"
              style={{ backgroundColor: "#F5F3F0" }}
            >
              <Image
                src="/logo.png"
                alt={siteConfig.name}
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{siteConfig.name}</h1>
          <p className="text-gray-500">加入我们，开启你的修仙之旅</p>
        </div>

        {/* ---------- 认证卡片：方角、虚线边框、米白背景 ---------- */}
        <div
          className="w-full p-8"
          style={{
            backgroundColor: "#F5F3F0",
            border: "1px dashed #333",
            borderRadius: "0px",
            minHeight: "500px",
          }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">注 册</h2>

          {/* ---------- 全局错误提示 ---------- */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ---------- 用户名 ---------- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (usernameError) setUsernameError(validateUsername(e.target.value));
                }}
                onBlur={() => setUsernameError(validateUsername(username))}
                placeholder="请输入用户名（2-20字符）"
                className={`w-full px-4 py-3 bg-white border rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                  usernameError ? "border-red-400" : "border-gray-300"
                }`}
                required
              />
              {usernameError && (
                <p className="mt-1 text-xs text-red-500">{usernameError}</p>
              )}
            </div>

            {/* ---------- 学号 ---------- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学号（选填）
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="请输入学号"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            {/* ---------- 所属峰 ---------- */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    所属峰（选填）
  </label>
  <select
    value={peak}
    onChange={(e) => setPeak(e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
  >
    <option value="无">无</option>
    <option value="项目峰">项目峰</option>
    <option value="算法峰">算法峰</option>
    <option value="电路峰">电路峰</option>
  </select>
  <p className="mt-1 text-xs text-gray-400">选择后将在宗门弟子名册中显示</p>
</div>

            {/* ---------- 密码 ---------- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(validatePassword(e.target.value));
                  if (confirmPasswordError) {
                    setConfirmPasswordError(validateConfirmPassword(confirmPassword, e.target.value));
                  }
                }}
                onBlur={() => setPasswordError(validatePassword(password))}
                placeholder="请输入密码（6-20字符）"
                className={`w-full px-4 py-3 bg-white border rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                  passwordError ? "border-red-400" : "border-gray-300"
                }`}
                required
              />
              {passwordError && (
                <p className="mt-1 text-xs text-red-500">{passwordError}</p>
              )}
            </div>

            {/* ---------- 确认密码 ---------- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) {
                    setConfirmPasswordError(validateConfirmPassword(e.target.value, password));
                  }
                }}
                onBlur={() => setConfirmPasswordError(validateConfirmPassword(confirmPassword, password))}
                placeholder="请再次输入密码"
                className={`w-full px-4 py-3 bg-white border rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                  confirmPasswordError ? "border-red-400" : "border-gray-300"
                }`}
                required
              />
              {confirmPasswordError && (
                <p className="mt-1 text-xs text-red-500">{confirmPasswordError}</p>
              )}
            </div>

            {/* ---------- 注册按钮 ---------- */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-800 text-white font-bold rounded-none shadow-md hover:bg-gray-900 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? "注册中..." : "注 册"}
            </button>
          </form>

          {/* ---------- 登录入口 ---------- */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              已有账号？
              <Link
                href="/login"
                className="text-amber-700 font-medium hover:text-amber-800 ml-1"
              >
                立即登录
              </Link>
            </p>
          </div>
        </div>

        {/* ---------- 返回首页 ---------- */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
