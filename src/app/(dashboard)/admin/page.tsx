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
import { AppMenu } from "@/components/dashboard/AppMenu";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import toast from "react-hot-toast";

import { ClassCodeManager } from "@/components/dashboard/ClassCodeManager";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { isDeveloperEmail } from "@/lib/developer";
import { Clock, ShieldAlert } from "lucide-react";

export default function AdminDashboard() {
  const { userData, logout, loading: authLoading, updateUserProfile } = useAuth();
  const { posts, loading: postsLoading } = usePosts();
  const router = useRouter();
  
  // Added filter state so Admins can preview the student view exactly as it is
  const [filter, setFilter] = useState<PostType | "ALL">("ALL");
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const isApprovedAdmin = Boolean(
    userData?.isDeveloper || 
    isDeveloperEmail(userData?.email) || 
    userData?.adminApprovalStatus === "APPROVED"
  );

  useEffect(() => {
    if (!authLoading) {
      if (!userData) {
        router.replace("/login?role=admin");
      } else if (userData.role === "STUDENT") {
        router.replace("/student");
      }
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

  // DEVELOPER APPROVAL GATEKEEPER
  if (!authLoading && userData?.role === "ADMIN" && !isApprovedAdmin) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden bg-[#dfe8df] dark:bg-[#09130e] transition-colors">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-400/20 dark:bg-amber-900/20 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 dark:bg-emerald-900/20 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }}></div>

        <div className="w-full max-w-md z-10">
          <div className="mb-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <BrandLogo size="md" align="center" tagline="Faculty & Admin Verification" />
          </div>

          <div className="glass rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-white/60 dark:border-[#1e3025] bg-white/60 dark:bg-[#121c16]/90 backdrop-blur-xl animate-in slide-in-from-bottom-6 fade-in duration-700 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700/60 flex items-center justify-center text-amber-700 dark:text-amber-400 shadow-sm relative">
              <Clock size={32} className="animate-spin text-amber-600 dark:text-amber-400" style={{ animationDuration: "8s" }} />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-white">Admin Approval Pending</h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                Your account has requested Teacher / CR privileges for ClassSync.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-[#192318] border border-amber-200/80 dark:border-[#2a3f2c] text-left text-xs space-y-1.5 text-stone-600 dark:text-stone-300">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">Account Status</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300">
                  Under Developer Review ⏳
                </span>
              </div>
              <p>Name: <strong>{userData.displayName}</strong></p>
              <p className="truncate">Email: <strong>{userData.email}</strong></p>
            </div>

            <div className="bg-emerald-50/50 dark:bg-[#121c16] rounded-xl p-3 border border-emerald-200/50 dark:border-[#1e3025] flex items-start gap-2.5 text-left">
              <ShieldAlert size={18} className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Once the platform developer approves your request, this dashboard will <strong>automatically refresh and unlock</strong> to grant you full administrative controls.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={async () => {
                  await updateUserProfile({ role: "STUDENT" });
                  router.replace("/join-class");
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-300 dark:border-[#243a2c] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#18261e] text-xs font-bold transition-all cursor-pointer"
              >
                Switch to Student Mode & Join Class
              </button>
              <button
                onClick={logout}
                className="w-full py-2.5 px-4 rounded-xl text-stone-400 hover:text-red-600 text-xs font-medium transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-8 max-w-7xl mx-auto min-h-screen overflow-x-hidden w-full">
      
      {/* Top Branding Logo & Tagline (Consistent across all pages) */}
      <BrandLogo size="md" align="center" className="mb-3 sm:mb-4 pt-1 sm:pt-2" />

      {/* Header with Glassmorphism */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 mb-4 glass px-4 py-3 sm:px-6 sm:py-4 rounded-3xl shadow-xs border border-stone-200/60 dark:border-[#1e3025]">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-700/20 shrink-0 ring-1 ring-emerald-500/20">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight flex items-center gap-2 truncate">
              Admin Portal
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm font-medium truncate">Manage classes and broadcast updates</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          <div className="flex items-center gap-2">
            <NotificationBell />
            <AppMenu />
          </div>
        </div>
      </header>

      {/* Responsive Quick Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-5">
        <Link 
          href="/admin/resources" 
          className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/80 dark:bg-[#121c16] hover:bg-emerald-50/70 dark:hover:bg-[#18261d] border border-stone-200/80 dark:border-[#1e3025] hover:border-emerald-300 dark:hover:border-emerald-700 shadow-2xs hover:shadow-xs transition-all group min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FolderOpen size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 truncate">
              All Subjects
            </h4>
            <p className="text-[10px] text-stone-400 font-medium truncate">Notes & PDFs</p>
          </div>
        </Link>

        <Link 
          href="/admin/timetable" 
          className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/80 dark:bg-[#121c16] hover:bg-amber-50/70 dark:hover:bg-[#18261d] border border-stone-200/80 dark:border-[#1e3025] hover:border-amber-300 dark:hover:border-amber-700 shadow-2xs hover:shadow-xs transition-all group min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Calendar size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 truncate">
              Time-Table
            </h4>
            <p className="text-[10px] text-stone-400 font-medium truncate">Schedules</p>
          </div>
        </Link>

        <Link 
          href="/admin/events" 
          className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/80 dark:bg-[#121c16] hover:bg-teal-50/70 dark:hover:bg-[#18261d] border border-stone-200/80 dark:border-[#1e3025] hover:border-teal-300 dark:hover:border-teal-700 shadow-2xs hover:shadow-xs transition-all group min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Camera size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover:text-teal-800 dark:group-hover:text-teal-300 truncate">
              Events & Media
            </h4>
            <p className="text-[10px] text-stone-400 font-medium truncate">Drive Photos & Videos</p>
          </div>
        </Link>

        <Link 
          href="/admin/birthdays" 
          className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/80 dark:bg-[#121c16] hover:bg-rose-50/70 dark:hover:bg-[#18261d] border border-stone-200/80 dark:border-[#1e3025] hover:border-rose-300 dark:hover:border-rose-700 shadow-2xs hover:shadow-xs transition-all group min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Cake size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover:text-rose-800 dark:group-hover:text-rose-300 truncate">
              Birthdays
            </h4>
            <p className="text-[10px] text-stone-400 font-medium truncate">Manager & Alerts</p>
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
          
          <div className="glass rounded-3xl shadow-sm border border-stone-200/70 dark:border-[#1e3025] p-6 sm:p-8 min-h-[600px]">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-white tracking-tight flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-850 dark:text-emerald-300 rounded-lg">
                  <Radio size={20} />
                </div>
                Student Panel Preview
              </h2>
              <span className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs py-1.5 px-3 rounded-full font-bold uppercase tracking-wider border border-stone-200/60 dark:border-stone-700">
                {posts.length} Active
              </span>
            </div>

            {/* Filter Tabs identical to Student View */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3 px-2">
                <h3 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-stone-900 to-emerald-950 dark:from-white dark:to-emerald-300">Live Feed</h3>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 bg-white/50 dark:bg-[#121c16]/80 backdrop-blur p-2 rounded-3xl border border-stone-200/70 dark:border-[#1e3025] shadow-xs">
                {(["ALL", "ANNOUNCEMENT", "ASSIGNMENT", "EXAM"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type as any)}
                    className={`group flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 ${
                      filter === type
                        ? "bg-stone-900 dark:bg-emerald-700 text-white shadow-md scale-100"
                        : "text-stone-600 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-[#1a2b20] hover:text-stone-900 dark:hover:text-white scale-95 hover:scale-100"
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
            
            {loading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-white/60 dark:bg-[#121c16]/60 backdrop-blur-md h-48 rounded-3xl border border-stone-100 dark:border-stone-800"></div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center text-stone-500 dark:text-stone-400 py-16 flex flex-col items-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl bg-stone-50/50 dark:bg-[#121c16]/50">
                <div className="w-20 h-20 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center mb-4 text-stone-300 dark:text-stone-600 shadow-sm">
                  <Radio size={40} />
                </div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-1 tracking-tight">Airwaves are clear</h3>
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
