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
import { useClassConfig } from "@/hooks/useClassConfig";

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
      if (userData?.role === "ADMIN") {
        router.push("/admin");
      } else if (userData?.role === "STUDENT" && !userData?.enrolledClassCode) {
        router.push("/join-class");
      }
    }
  }, [userData, authLoading, router]);

  const loading = authLoading || postsLoading;

  const filteredPosts = posts.filter(
    post => filter === "ALL" || post.type === filter
  );

  return (
    <div className="p-3 md:p-8 max-w-5xl mx-auto min-h-screen overflow-x-hidden w-full">
      
      {/* Top Branding - Ultra slim on mobile, full hero on desktop */}
      <div className="flex items-center justify-between mb-2 px-1 sm:hidden">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-md flex items-center justify-center text-white shadow-2xs">
            <BookOpen size={11} strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-xs text-slate-900 tracking-tight">ClassSync</span>
        </div>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-full border border-blue-100">Student Portal</span>
      </div>

      <div className="hidden sm:flex flex-col items-center justify-center text-center mb-4 mt-1 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 ring-4 ring-white">
            <BookOpen size={20} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm">ClassSync</h2>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 max-w-sm mx-auto">Bridging the gap between classrooms and students.</p>
      </div>

      {/* Header with Glassmorphism - Compact single row on mobile */}
      <header className="flex items-center justify-between gap-2 mb-2.5 sm:mb-4 glass px-3 py-2 sm:px-5 sm:py-3 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-xs sm:text-base shadow-sm shrink-0">
            {userData?.displayName?.charAt(0) || "S"}
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1 truncate">
              <span className="truncate">Hello, {userData?.displayName?.split(" ")[0] || "Student"}</span> 
              <Sparkles className="text-yellow-400 shrink-0" size={13} />
            </h1>
            <p className="text-[10px] text-slate-400 font-medium truncate">Learning Hub</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <StudentClassSwitcher />
          <NotificationBell />
          <button 
            onClick={logout}
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-white/90 text-slate-600 hover:text-red-600 rounded-xl font-semibold text-xs transition-all border border-slate-200 shadow-2xs hover:shadow-xs cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Responsive Quick Navigation Row (1 row of 4 chips on mobile, full cards on desktop) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 mb-2.5 sm:mb-4">
        <Link 
          href="/student/resources" 
          className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/85 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all group min-w-0 text-center sm:text-left"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FolderOpen size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-900 group-hover:text-blue-700 truncate">
              Subjects
            </h4>
            <p className="text-[9px] text-slate-400 font-medium truncate hidden sm:block">Notes & PDFs</p>
          </div>
        </Link>

        <Link 
          href="/student/timetable" 
          className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/85 hover:bg-purple-50/70 border border-slate-200/80 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all group min-w-0 text-center sm:text-left"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Calendar size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-900 group-hover:text-purple-700 truncate">
              Time-Table
            </h4>
            <p className="text-[9px] text-slate-400 font-medium truncate hidden sm:block">Lectures & Exams</p>
          </div>
        </Link>

        <Link 
          href="/student/events" 
          className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/85 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all group min-w-0 text-center sm:text-left"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Camera size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-900 group-hover:text-emerald-700 truncate">
              Media
            </h4>
            <p className="text-[9px] text-slate-400 font-medium truncate hidden sm:block">Drive Albums</p>
          </div>
        </Link>

        <Link 
          href="/student/birthdays" 
          className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/85 hover:bg-pink-50/70 border border-slate-200/80 hover:border-pink-300 shadow-2xs hover:shadow-xs transition-all group min-w-0 text-center sm:text-left"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Cake size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-900 group-hover:text-pink-700 truncate">
              Birthdays
            </h4>
            <p className="text-[9px] text-slate-400 font-medium truncate hidden sm:block">Wishes & Dates</p>
          </div>
        </Link>
      </div>

      <div className="mb-5">
        <CalendarWidget posts={posts} />
      </div>

      {/* Modern Filter Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3 px-2">
          <h3 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600">Live Feed</h3>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-white/50 backdrop-blur p-2 rounded-3xl border border-slate-200/60 shadow-sm">
          {(["ALL", "ANNOUNCEMENT", "ASSIGNMENT", "EXAM"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`group flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 ${
                filter === type
                  ? "bg-slate-900 text-white shadow-md scale-100"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 scale-95 hover:scale-100"
              }`}
            >
              {type === "ALL" && <LayoutGrid size={16} className={filter === "ALL" ? "text-blue-400" : ""} />}
              <span>{type === "ALL" ? "All Updates" : type.charAt(0) + type.slice(1).toLowerCase() + "s"}</span>
              <span className={`ml-1 text-[10px] font-bold py-0.5 px-2 rounded-full transition-colors ${
                filter === type 
                  ? "bg-white/20 text-white" 
                  : "bg-slate-200 text-slate-500 group-hover:bg-white group-hover:text-slate-700"
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
            <div className="animate-pulse bg-white/60 backdrop-blur-md h-48 rounded-3xl border border-slate-100"></div>
            <div className="animate-pulse bg-white/60 backdrop-blur-md h-48 rounded-3xl border border-slate-100"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="glass rounded-3xl shadow-sm border-slate-200/50 p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-100 to-teal-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-white">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">You're all caught up!</h3>
            <p className="text-slate-500 font-medium max-w-sm">
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
