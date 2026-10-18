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
  Settings,
  Pencil,
  Phone
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme, Theme } from "@/components/providers/ThemeProvider";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useClassConfig } from "@/hooks/useClassConfig";
import { EditProfileModal } from "@/components/dashboard/EditProfileModal";
import Link from "next/link";
import toast from "react-hot-toast";

export function AppMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
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
        className="w-full max-w-sm sm:max-w-md h-full bg-white dark:bg-[#09130e] text-stone-900 dark:text-stone-100 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 border-l border-stone-200/80 dark:border-stone-800"
        style={{
          paddingTop: "max(1.25rem, env(safe-area-inset-top, 1.25rem))",
          paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 1.25rem))",
        }}
      >
        
        {/* Top Header & Close Button */}
        <div>
          <div className="flex items-center justify-between px-5 pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Settings size={17} />
              </div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white tracking-tight">
                Menu & Settings
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* User Profile Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-stone-50/60 dark:from-stone-800/90 dark:via-stone-800/60 dark:to-stone-900/80 border border-emerald-100/80 dark:border-stone-700/60 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-700/25 ring-3 ring-white dark:ring-stone-800 shrink-0 overflow-hidden">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt={userData.displayName} className="w-full h-full object-cover" />
                  ) : (
                    userData?.displayName?.charAt(0) || "U"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="font-extrabold text-stone-900 dark:text-white text-base truncate">
                        {userData?.displayName || "Student"}
                      </h4>
                      <Sparkles size={14} className="text-yellow-500 shrink-0" />
                    </div>

                    {/* Edit Profile Button */}
                    <button
                      type="button"
                      onClick={() => setIsEditProfileOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-emerald-50 dark:bg-stone-700/90 dark:hover:bg-stone-700 text-emerald-700 dark:text-emerald-400 border border-stone-200/80 dark:border-stone-600 text-[11px] font-bold shadow-2xs transition-all cursor-pointer shrink-0"
                      title="Edit Profile Details"
                    >
                      <Pencil size={11} />
                      <span>Edit</span>
                    </button>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {userData?.email || "Signed In"}
                  </p>
                  
                  {/* Profile Badges: Role, Class, Gender, Phone */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-700/60">
                      {userData?.role || "STUDENT"}
                    </span>
                    {currentClassName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-stone-700/90 text-stone-700 dark:text-stone-200 border border-stone-200/80 dark:border-stone-600 truncate max-w-[170px]">
                        <GraduationCap size={11} className="text-emerald-700 shrink-0" />
                        <span className="truncate">{currentClassName}</span>
                      </span>
                    )}
                    {userData?.gender && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 dark:bg-stone-700/80 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-600">
                        {userData.gender}
                      </span>
                    )}
                    {userData?.phoneNumber && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700">
                        <Phone size={10} className="text-stone-400" />
                        <span>{userData.phoneNumber}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Preference Segmented Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-400 tracking-tight flex items-center justify-between">
                <span>Theme Mode</span>
                <span className="text-[10px] font-medium text-stone-400 capitalize">{theme}</span>
              </label>
              
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    theme === "light"
                      ? "bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-300 shadow-xs"
                      : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white"
                  }`}
                >
                  <Sun size={14} />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    theme === "dark"
                      ? "bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-300 shadow-xs"
                      : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white"
                  }`}
                >
                  <Moon size={14} />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    theme === "system"
                      ? "bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-300 shadow-xs"
                      : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white"
                  }`}
                >
                  <Laptop size={14} />
                  <span>Auto</span>
                </button>
              </div>
            </div>

            {/* Site & App Settings */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-400 tracking-tight">
                Quick Preferences
              </label>

              <div className="space-y-1.5">
                {/* Push Notifications Status & Switch */}
                <div 
                  onClick={permission === 'granted' ? toggleReminders : requestPermission}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 hover:bg-stone-100/70 dark:hover:bg-stone-800 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isEnabled ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700" : "bg-stone-200 dark:bg-stone-700 text-stone-500"
                    }`}>
                      {isEnabled ? <Bell size={15} /> : <BellOff size={15} />}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-stone-900 dark:text-white">Push Notifications</h5>
                      <p className="text-[10px] text-stone-400">Class & birthday reminders</p>
                    </div>
                  </div>

                  {/* Visual switch */}
                  <div className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors duration-200 ease-in-out shrink-0 ${
                    isEnabled ? "bg-emerald-600 shadow-inner" : "bg-stone-300 dark:bg-stone-600"
                  }`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                      isEnabled ? "translate-x-3" : "translate-x-0"
                    }`} />
                  </div>
                </div>

                {/* Offline & PWA Info */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={15} />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-stone-900 dark:text-white">Offline Capability</h5>
                      <p className="text-[10px] text-stone-400">PWA Service Worker active</p>
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
              <label className="text-xs font-bold text-stone-600 dark:text-stone-400 tracking-tight">
                Shortcuts
              </label>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`${basePath}/resources`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 hover:bg-emerald-50/70 hover:border-emerald-200 dark:hover:bg-stone-800 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 flex items-center justify-center shrink-0">
                    <FolderOpen size={14} />
                  </div>
                  <span className="font-extrabold text-xs text-stone-800 dark:text-stone-200 group-hover:text-emerald-700 truncate">Subjects</span>
                </Link>

                <Link
                  href={`${basePath}/timetable`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 hover:bg-amber-50/70 hover:border-amber-200 dark:hover:bg-stone-800 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 flex items-center justify-center shrink-0">
                    <Calendar size={14} />
                  </div>
                  <span className="font-extrabold text-xs text-stone-800 dark:text-stone-200 group-hover:text-amber-700 truncate">Time-Table</span>
                </Link>

                <Link
                  href={`${basePath}/events`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 hover:bg-teal-50/70 hover:border-teal-200 dark:hover:bg-stone-800 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-700 flex items-center justify-center shrink-0">
                    <Camera size={14} />
                  </div>
                  <span className="font-extrabold text-xs text-stone-800 dark:text-stone-200 group-hover:text-teal-700 truncate">Media</span>
                </Link>

                <Link
                  href={`${basePath}/birthdays`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 hover:bg-rose-50/70 hover:border-rose-200 dark:hover:bg-stone-800 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 flex items-center justify-center shrink-0">
                    <Cake size={14} />
                  </div>
                  <span className="font-extrabold text-xs text-stone-800 dark:text-stone-200 group-hover:text-rose-700 truncate">Birthdays</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with App Info & Sign Out Button */}
        <div className="p-5 border-t border-stone-100 dark:border-stone-800 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-extrabold text-xs sm:text-sm border border-red-200/80 dark:border-red-800/60 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <LogOut size={15} />
            <span>Sign Out of ClassSync</span>
          </button>

          <div className="text-center">
            <p className="text-[10px] text-stone-400 font-medium">ClassSync v0.1.0 • PWA Ready</p>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-white/90 dark:bg-stone-800/90 text-stone-600 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-stone-700 rounded-xl transition-all border border-stone-200/90 dark:border-stone-700 shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
        title="Menu & Settings"
      >
        <Menu size={16} />
      </button>

      {mounted && isOpen && createPortal(menuContent, document.body)}
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
    </>
  );
}
