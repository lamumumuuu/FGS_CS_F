"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { siteConfig, navMenuItems } from "@/siteConfig";
import { useState, useEffect, useRef } from "react";
import { User } from "@/types/user";
import { userApi } from "@/app/api/client";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const currentUser = await userApi.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  }

  function handleMouseEnter() {
    setShowAvatarDropdown(true);
  }

  function handleMouseLeave() {
    setShowAvatarDropdown(false);
  }

  async function handleLogout() {
    try {
      await userApi.logout();
      setShowAvatarDropdown(false);
      loadUser();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  const isLoggedIn = user?.isLoggedIn ?? false;

  return (
    <nav className="bg-amber-800 text-white px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Image
                src={siteConfig.logo}
                alt={siteConfig.name}
                width={32}
                height={32}
              />
            </div>
            <span className="text-xl font-bold">{siteConfig.name}</span>
          </Link>
        </div>

        <div className="flex items-center gap-8">
          {navMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-base font-medium transition-colors hover:text-amber-200 ${pathname === item.href
                ? "text-amber-200 border-b-2 border-amber-200 pb-1"
                : "text-white"
                }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn && (
            <div className="flex items-center gap-2 bg-amber-900 px-3 py-1.5 rounded-full">
              <span className="text-amber-200">💎</span>
              <span className="font-semibold">{user?.lingshi ?? -1}</span>
              <span className="text-sm text-amber-200">灵石</span>
            </div>
          )}

          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 cursor-pointer transition-colors ${isLoggedIn
                ? "bg-amber-600 border-amber-400"
                : "bg-gray-400 border-gray-300"
                }`}
            >
              <span className="text-lg">👤</span>
            </div>

            {showAvatarDropdown && (
              <div className="absolute right-0 top-12 z-50 w-72 bg-white rounded-xl shadow-xl border border-amber-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {isLoggedIn && user ? (
                  <>
                    <div className="bg-gradient-to-r from-amber-700 to-amber-600 p-4 text-white">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                          👤
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-lg truncate">
                            {user.username}
                          </div>
                          <div className="text-amber-200 text-sm">
                            {user.role ?? "外门弟子"}
                            {user.peak ? ` · ${user.peak}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-amber-500/30">
                        <div className="text-sm">
                          <span className="text-amber-200">称号：</span>
                          <span className="text-white">{user.title ?? "无"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-amber-200">💎</span>
                          <span className="font-bold">{user.lingshi}</span>
                          <span className="text-amber-200 text-sm">灵石</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/profile"
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <span>👤</span>
                        <span>个人中心</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <span>🚪</span>
                        <span>退出登录</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3">
                    <Link
                      href="/login"
                      className="w-full px-4 py-2.5 text-center text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 rounded-lg font-medium transition-colors block mb-2"
                    >
                      登录
                    </Link>
                    <Link
                      href="/register"
                      className="w-full px-4 py-2.5 text-center text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg font-medium transition-colors block"
                    >
                      注册
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
