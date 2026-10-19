"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePosts } from "@/hooks/usePosts";
import { PostCard } from "@/components/dashboard/PostCard";
import { PostType } from "@/types";
import Link from "next/link";
import { Sparkles, LayoutGrid, CheckCircle2, LogOut, FolderOpen, BookOpen, Calendar, GraduationCap, Cake, Camera } from "lucide-react";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { StudentClassSwitcher } from "@/components/dashboard/StudentClassSwitcher";
import { AppMenu } from "@/components/dashboard/AppMenu";
import { useClassConfig } from "@/hooks/useClassConfig";

import { BrandLogo } from "@/components/ui/BrandLogo";

export default function StudentDashboard() {
  const { userData, logout, loading: authLoading } = useAuth();
  const { posts, loading: postsLoading } = usePosts();
  const { classes, classConfig } = useClassConfig();
  const [filter, setFilter] = useState<PostType | "ALL">("ALL");
  const router = useRouter();

  const currentClassName = classes.find(c => c.code.toUpperCase() === userData?.enrolledClassCode?.toUpperCase())?.name 
    || (classConfig.classCode.toUpperCase() === userData?.enrolledClassCode?.toUpperCase() ? classConfig.className : null) 
    || userData?.enrolledClassCode;

  useEffect(() => {
    if (!authLoading) {
      if (!userData) {
        router.replace("/login?role=student");
      } else if (userData.role === "ADMIN") {
        router.replace("/admin");
      } else if (userData.role === "STUDENT" && !userData.enrolledClassCode) {
        router.replace("/join-class");
      }
    }
  }, [userData, authLoading, router]);

  const loading = authLoading || postsLoading;

  const filteredPosts = posts.filter(
    post => filter === "ALL" || post.type === filter
  );

  return (
    <div className="p-3 md:p-8 max-w-5xl mx-auto min-h-screen overflow-x-hidden w-full">
      
      {/* Top Branding Logo & Tagline (Consistent across all pages) */}
      <BrandLogo size="md" align="center" className="mb-3 sm:mb-4 pt-1 sm:pt-2" />

      {/* Header with Glassmorphism - Perfectly aligned & balanced */}
      <header className="glass px-3.5 py-3 sm:px-6 sm:py-3.5 rounded-2xl sm:rounded-3xl shadow-xs border border-stone-200/60 dark:border-[#1e3025] mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
        
        {/* Top on Mobile / Left on Desktop: User Profile Greeting */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3.5 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-tr from-emerald-700 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-sm sm:text-lg shadow-md shadow-emerald-600/20 shrink-0 overflow-hidden ring-2 ring-white/60 dark:ring-stone-800">
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt={userData.displayName} className="w-full h-full object-cover" />
              ) : (
                userData?.displayName?.charAt(0) || "S"
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg md:text-xl font-extrabold text-stone-900 dark:text-white tracking-tight flex items-center gap-1.5 truncate">
                <span>Hello, {userData?.displayName?.split(" ")[0] || "Student"}</span> 
                <Sparkles className="text-yellow-400 shrink-0" size={15} />
              </h1>
              <p className="text-[11px] sm:text-xs text-stone-400 font-medium">Learning Hub</p>
            </div>
          </div>

          {/* App Menu icon on mobile (top-right) */}
          <div className="sm:hidden">
            <AppMenu />
          </div>
        </div>

        {/* Bottom on Mobile / Right on Desktop: Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t border-stone-100 dark:border-stone-800 sm:border-0">
          <StudentClassSwitcher />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <NotificationBell />
            <div className="hidden sm:block">
              <AppMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Responsive Quick Navigation Row (1 row of 4 chips on mobile, full cards on desktop) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 mb-2.5 sm:mb-4">
        <Link 
          href="/student/resources" 
          className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/85 dark:bg-[#121c16] hover:bg-emerald-50/70 dark:hover:bg-[#18261d] border border-stone-200/80 dark:border-[#1e3025] hover:border-emerald-300 dark:hover:border-emerald-700 shadow-2xs hover:shadow-xs transition-all group min-w-0 text-center sm:text-left"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FolderOpen size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-[11px] sm:text-xs text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 truncate">
              Subjects
            </h4>
            <p className="text-[9px] text-stone-400 font-medium truncate hidden sm:block">Notes & PDFs</p>
          </div>
        </Link>

        <Link 
          href="/student/timetable" 
          className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/85 dark:bg-[#121c16] hover:bg-amber-50/70 dark:hover:bg-[#18261d] border border-stone-200/80 dark:border-[#1e3025] hover:border-amber-300 dark:hover:border-amber-700 shadow-2xs hover:shadow-xs transition-all group min-w-0 text-center sm:text-left"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Calendar size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-[11px] sm:text-xs text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 truncate">
              Time-Table
            </h4>
            <p className="text-[9px] text-stone-400 font-medium truncate hidden sm:block">Lectures & Exams</p>
          </div>
        </Link>

        <Link 
          href="/student/events" 
          className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/85 dark:bg-[#121c16] hover:bg-teal-50/70 dark:hover:bg-[#18261d] border border-stone-200/80 dark:border-[#1e3025] hover:border-teal-300 dark:hover:border-teal-700 shadow-2xs hover:shadow-xs transition-all group min-w-0 text-center sm:text-left"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Camera size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-[11px] sm:text-xs text-stone-900 dark:text-stone-100 group-hover:text-teal-800 dark:group-hover:text-teal-300 truncate">
              Media
            </h4>
            <p className="text-[9px] text-stone-400 font-medium truncate hidden sm:block">Drive Albums</p>
          </div>
        </Link>

        <Link 
          href="/student/birthdays" 
          className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/85 dark:bg-[#121c16] hover:bg-rose-50/70 dark:hover:bg-[#18261d] border border-stone-200/80 dark:border-[#1e3025] hover:border-rose-300 dark:hover:border-rose-700 shadow-2xs hover:shadow-xs transition-all group min-w-0 text-center sm:text-left"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Cake size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-[11px] sm:text-xs text-stone-900 dark:text-stone-100 group-hover:text-rose-800 dark:group-hover:text-rose-300 truncate">
              Birthdays
            </h4>
            <p className="text-[9px] text-stone-400 font-medium truncate hidden sm:block">Wishes & Dates</p>
          </div>
        </Link>
      </div>

      <div className="mb-5">
        <CalendarWidget posts={posts} />
      </div>

      {/* Modern Filter Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3 px-2">
          <h3 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-stone-900 to-emerald-950 dark:from-white dark:to-emerald-300">Live Feed</h3>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-white/60 dark:bg-[#121c16]/80 backdrop-blur p-2 rounded-3xl border border-stone-200/70 dark:border-[#1e3025] shadow-sm">
          {(["ALL", "ANNOUNCEMENT", "ASSIGNMENT", "EXAM"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`group flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 ${
                filter === type
                  ? "bg-stone-900 dark:bg-emerald-700 text-white shadow-md scale-100"
                  : "text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-[#1a2b20] hover:text-stone-900 dark:hover:text-white scale-95 hover:scale-100"
              }`}
            >
              {type === "ALL" && <LayoutGrid size={16} className={filter === "ALL" ? "text-emerald-400" : ""} />}
              <span>{type === "ALL" ? "All Updates" : type.charAt(0) + type.slice(1).toLowerCase() + "s"}</span>
              <span className={`ml-1 text-[10px] font-bold py-0.5 px-2 rounded-full transition-colors ${
                filter === type 
                  ? "bg-white/20 text-white" 
                  : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 group-hover:bg-white dark:group-hover:bg-stone-700 group-hover:text-stone-800 dark:group-hover:text-white"
              }`}>
                {type === "ALL" ? posts.length : posts.filter(p => p.type === type).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="space-y-6">
        {loading ? (
          <div className="grid gap-6">
            <div className="animate-pulse bg-white/60 dark:bg-[#121c16]/60 backdrop-blur-md h-48 rounded-3xl border border-stone-100 dark:border-stone-800"></div>
            <div className="animate-pulse bg-white/60 dark:bg-[#121c16]/60 backdrop-blur-md h-48 rounded-3xl border border-stone-100 dark:border-stone-800"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="glass rounded-3xl shadow-sm border border-stone-200/60 dark:border-[#1e3025] p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-100 to-teal-50 dark:from-emerald-950/80 dark:to-teal-950/60 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-white dark:ring-[#121c16]">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 dark:text-white mb-2 tracking-tight">You're all caught up!</h3>
            <p className="text-stone-500 dark:text-stone-400 font-medium max-w-sm">
              There are no {filter !== "ALL" ? filter.toLowerCase() + "s" : "updates"} waiting for your attention right now.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
