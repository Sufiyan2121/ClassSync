"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { ComposerForm } from "@/components/dashboard/ComposerForm";
import { PostCard } from "@/components/dashboard/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { Post, PostType } from "@/types";
import Link from "next/link";
import { ShieldCheck, LogOut, Radio, LayoutGrid, FolderOpen, BookOpen, Calendar, Cake, Camera } from "lucide-react";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import toast from "react-hot-toast";

import { ClassCodeManager } from "@/components/dashboard/ClassCodeManager";

export default function AdminDashboard() {
  const { userData, logout, loading: authLoading } = useAuth();
  const { posts, loading: postsLoading } = usePosts();
  const router = useRouter();
  
  // Added filter state so Admins can preview the student view exactly as it is
  const [filter, setFilter] = useState<PostType | "ALL">("ALL");
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  useEffect(() => {
    if (!authLoading && userData?.role === "STUDENT") {
      router.push("/student");
    }
  }, [userData, authLoading, router]);

  const loading = authLoading || postsLoading;

  const filteredPosts = posts.filter(
    post => filter === "ALL" || post.type === filter
  );

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
      toast.success("Post deleted successfully");
      if (editingPost?.id === postId) {
        setEditingPost(null);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  return (
    <div className="p-3 md:p-8 max-w-7xl mx-auto min-h-screen overflow-x-hidden w-full">
      
      {/* Top Branding Logo & Tagline (Centered) */}
      <div className="flex flex-col items-center justify-center text-center mb-3 sm:mb-4 pt-1 sm:pt-2 select-none animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="inline-flex items-center justify-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 ring-1 ring-blue-500/15 shrink-0">
            <BookOpen size={17} className="sm:w-5 sm:h-5 text-white" strokeWidth={2.4} />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
            ClassSync
          </h2>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1.5 sm:mt-2 max-w-sm mx-auto tracking-normal">
          Bridging the gap between classrooms and students.
        </p>
      </div>

      {/* Header with Glassmorphism */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 mb-4 glass px-4 py-3 sm:px-6 sm:py-4 rounded-3xl shadow-xs border border-slate-200/50">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 truncate">
              Admin Portal
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium truncate">Manage classes and broadcast updates</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button 
              onClick={logout}
              className="flex items-center gap-1.5 bg-white/90 text-slate-600 px-3 py-2 rounded-xl font-semibold text-xs hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200 shadow-2xs hover:shadow-xs cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={13} />
              <span className="hidden xs:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Responsive Quick Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-5">
        <Link 
          href="/admin/resources" 
          className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/80 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all group min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FolderOpen size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 truncate">
              All Subjects
            </h4>
            <p className="text-[10px] text-slate-400 font-medium truncate">Notes & PDFs</p>
          </div>
        </Link>

        <Link 
          href="/admin/timetable" 
          className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/80 hover:bg-purple-50/70 border border-slate-200/80 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all group min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Calendar size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-purple-700 truncate">
              Time-Table
            </h4>
            <p className="text-[10px] text-slate-400 font-medium truncate">Schedules</p>
          </div>
        </Link>

        <Link 
          href="/admin/events" 
          className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/80 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all group min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Camera size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 truncate">
              Events & Media
            </h4>
            <p className="text-[10px] text-slate-400 font-medium truncate">Drive Photos & Videos</p>
          </div>
        </Link>

        <Link 
          href="/admin/birthdays" 
          className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/80 hover:bg-pink-50/70 border border-slate-200/80 hover:border-pink-300 shadow-2xs hover:shadow-xs transition-all group min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Cake size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-pink-700 truncate">
              Birthdays
            </h4>
            <p className="text-[10px] text-slate-400 font-medium truncate">Manager & Alerts</p>
          </div>
        </Link>
      </div>

      {/* Class Code Manager for Teacher */}
      <ClassCodeManager />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Composer */}
        <div className="lg:col-span-5 xl:col-span-4">
          <ComposerForm editingPost={editingPost} onCancelEdit={() => setEditingPost(null)} />
        </div>
        
        {/* Right Column: Live Feed (Student Panel Preview) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="mb-8">
            <CalendarWidget posts={posts} />
          </div>
          
          <div className="glass rounded-3xl shadow-sm border border-slate-200/50 p-6 sm:p-8 min-h-[600px]">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Radio size={20} />
                </div>
                Student Panel Preview
              </h2>
              <span className="bg-slate-100 text-slate-600 text-xs py-1.5 px-3 rounded-full font-bold uppercase tracking-wider border border-slate-200">
                {posts.length} Active
              </span>
            </div>

            {/* Filter Tabs identical to Student View */}
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
            
            {loading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-white/60 backdrop-blur-md h-48 rounded-3xl border border-slate-100"></div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center text-slate-500 py-16 flex flex-col items-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 text-slate-300 shadow-sm">
                  <Radio size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">Airwaves are clear</h3>
                <p className="max-w-xs font-medium">Use the composer on the left to broadcast your first update to the class.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredPosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
