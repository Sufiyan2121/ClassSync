"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Menu, 
  X, 
  LogOut, 
  User, 
  Sun, 
  Moon, 
  Laptop, 
  Bell, 
  BellOff, 
  GraduationCap, 
  FolderOpen, 
  Calendar, 
  Camera, 
  Cake, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  Settings
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme, Theme } from "@/components/providers/ThemeProvider";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useClassConfig } from "@/hooks/useClassConfig";
import Link from "next/link";
import toast from "react-hot-toast";

export function AppMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { userData, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isEnabled, permission, toggleReminders, requestPermission } = usePushNotifications();
  const { classes, classConfig } = useClassConfig();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const currentClassName = classes.find(
    c => c.code.toUpperCase() === userData?.enrolledClassCode?.toUpperCase()
  )?.name || (classConfig.classCode.toUpperCase() === userData?.enrolledClassCode?.toUpperCase() ? classConfig.className : null) 
    || userData?.enrolledClassCode;

  const isStudent = userData?.role === "STUDENT";
  const basePath = isStudent ? "/student" : "/admin";

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const menuContent = (
    <div 
      className="fixed inset-0 z-[99999] flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      {/* Slide-over Drawer Panel */}
      <div 
        className="w-full max-w-sm sm:max-w-md h-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 border-l border-slate-200/80 dark:border-slate-800"
        style={{
          paddingTop: "max(1.25rem, env(safe-area-inset-top, 1.25rem))",
          paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 1.25rem))",
        }}
      >
        
        {/* Top Header & Close Button */}
        <div>
          <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Settings size={17} />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                Menu & Settings
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* User Profile Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50/60 dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-900/80 border border-blue-100/80 dark:border-slate-700/60 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/25 ring-3 ring-white dark:ring-slate-800 shrink-0">
                  {userData?.displayName?.charAt(0) || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base truncate">
                      {userData?.displayName || "Student"}
                    </h4>
                    <Sparkles size={14} className="text-yellow-500 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {userData?.email || "Signed In"}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/60">
                      {userData?.role || "STUDENT"}
                    </span>
                    {currentClassName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-700/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-600 truncate max-w-[170px]">
                        <GraduationCap size={11} className="text-blue-600 shrink-0" />
                        <span className="truncate">{currentClassName}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Preference Segmented Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 tracking-tight flex items-center justify-between">
                <span>Theme Mode</span>
                <span className="text-[10px] font-medium text-slate-400 capitalize">{theme}</span>
              </label>
              
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    theme === "light"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <Sun size={14} />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    theme === "dark"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <Moon size={14} />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    theme === "system"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <Laptop size={14} />
                  <span>Auto</span>
                </button>
              </div>
            </div>

            {/* Site & App Settings */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 tracking-tight">
                Quick Preferences
              </label>

              <div className="space-y-1.5">
                {/* Push Notifications Status & Switch */}
                <div 
                  onClick={permission === 'granted' ? toggleReminders : requestPermission}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isEnabled ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    }`}>
                      {isEnabled ? <Bell size={15} /> : <BellOff size={15} />}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">Push Notifications</h5>
                      <p className="text-[10px] text-slate-400">Class & birthday reminders</p>
                    </div>
                  </div>

                  {/* Visual switch */}
                  <div className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors duration-200 ease-in-out shrink-0 ${
                    isEnabled ? "bg-blue-600 shadow-inner" : "bg-slate-300 dark:bg-slate-600"
                  }`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                      isEnabled ? "translate-x-3" : "translate-x-0"
                    }`} />
                  </div>
                </div>

                {/* Offline & PWA Info */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={15} />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">Offline Capability</h5>
                      <p className="text-[10px] text-slate-400">PWA Service Worker active</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-700/60">
                    Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 tracking-tight">
                Shortcuts
              </label>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`${basePath}/resources`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:bg-blue-50/70 hover:border-blue-200 dark:hover:bg-slate-800 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center shrink-0">
                    <FolderOpen size={14} />
                  </div>
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-600 truncate">Subjects</span>
                </Link>

                <Link
                  href={`${basePath}/timetable`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:bg-purple-50/70 hover:border-purple-200 dark:hover:bg-slate-800 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center shrink-0">
                    <Calendar size={14} />
                  </div>
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-purple-600 truncate">Time-Table</span>
                </Link>

                <Link
                  href={`${basePath}/events`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:bg-emerald-50/70 hover:border-emerald-200 dark:hover:bg-slate-800 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Camera size={14} />
                  </div>
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 truncate">Media</span>
                </Link>

                <Link
                  href={`${basePath}/birthdays`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:bg-pink-50/70 hover:border-pink-200 dark:hover:bg-slate-800 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-900/50 text-pink-600 flex items-center justify-center shrink-0">
                    <Cake size={14} />
                  </div>
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-pink-600 truncate">Birthdays</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with App Info & Sign Out Button */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-extrabold text-xs sm:text-sm border border-red-200/80 dark:border-red-800/60 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <LogOut size={15} />
            <span>Sign Out of ClassSync</span>
          </button>

          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-medium">ClassSync v0.1.0 • PWA Ready</p>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200/90 dark:border-slate-700 shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
        title="Menu & Settings"
      >
        <Menu size={16} />
      </button>

      {mounted && isOpen && createPortal(menuContent, document.body)}
    </>
  );
}
