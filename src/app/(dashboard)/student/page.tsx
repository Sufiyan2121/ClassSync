"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePosts } from "@/hooks/usePosts";
import { PostCard } from "@/components/dashboard/PostCard";
import { PostType } from "@/types";
import Link from "next/link";
import { Sparkles, LayoutGrid, CheckCircle2, LogOut, FolderOpen, BookOpen, Calendar } from "lucide-react";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

export default function StudentDashboard() {
  const { userData, logout, loading: authLoading } = useAuth();
  const { posts, loading: postsLoading } = usePosts();
  const [filter, setFilter] = useState<PostType | "ALL">("ALL");
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && userData?.role === "ADMIN") {
      router.push("/admin");
    }
  }, [userData, authLoading, router]);

  const loading = authLoading || postsLoading;

  const filteredPosts = posts.filter(
    post => filter === "ALL" || post.type === filter
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen overflow-x-hidden w-full">
      
      {/* Top Branding Logo */}
      <div className="flex flex-col items-center justify-center text-center mb-8 mt-2 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 ring-4 ring-white">
            <BookOpen size={24} strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm">ClassSync</h2>
        </div>
        <p className="text-slate-500 text-sm font-medium mt-1 max-w-sm mx-auto">Bridging the gap between classrooms and students.</p>
      </div>

      {/* Header with Glassmorphism */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 glass px-6 py-4 rounded-3xl shadow-sm border border-slate-200/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 shrink-0">
            {userData?.displayName?.charAt(0) || "S"}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Hello, {userData?.displayName?.split(" ")[0] || "Student"} <Sparkles className="text-yellow-400 shrink-0" size={20} />
            </h1>
            <p className="text-slate-500 text-sm font-medium">Your learning hub is ready</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <NotificationBell />
          <Link href="/student/timetable" className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-100 transition-all shadow-sm">
            <Calendar size={16} />
            <span>Time-Table</span>
          </Link>
          <Link href="/student/resources" className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all shadow-sm">
            <FolderOpen size={16} />
            <span>All Subjects</span>
          </Link>
          <button 
            onClick={logout}
            className="flex items-center gap-2 bg-white/80 text-slate-600 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200 shadow-sm hover:shadow-md ml-auto md:ml-0"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Modern Filter Tabs */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-3 px-2">Live Feed</h3>
        <div className="flex flex-wrap items-center gap-2 bg-white/50 backdrop-blur p-2 rounded-3xl border border-slate-200/60 shadow-sm">
          {(["ALL", "ANNOUNCEMENT", "ASSIGNMENT", "EXAM", "RESOURCE"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 ${
                filter === type
                  ? "bg-slate-900 text-white shadow-md scale-100"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 scale-95 hover:scale-100"
              }`}
            >
              {type === "ALL" && <LayoutGrid size={16} className={filter === "ALL" ? "text-blue-400" : ""} />}
              {type === "ALL" ? "All Updates" : type.charAt(0) + type.slice(1).toLowerCase() + "s"}
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
