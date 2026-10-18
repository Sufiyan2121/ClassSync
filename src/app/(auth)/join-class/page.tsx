"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useClassConfig } from "@/hooks/useClassConfig";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { KeyRound, LogOut, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function JoinClassPage() {
  const { user, userData, loading: authLoading, logout, enrollInClass } = useAuth();
  const { classConfig, loading: configLoading, verifyCode } = useClassConfig();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Intelligent routing guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }

    if (!authLoading && userData) {
      if (userData.role === "ADMIN") {
        router.replace("/admin");
        return;
      }
      // If student already has enrolled in the current active class, go to dashboard
      if (userData.enrolledClassCode && userData.enrolledClassCode === classConfig.classCode) {
        router.replace("/student");
      }
    }
  }, [user, userData, authLoading, classConfig, router]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      toast.error("Please enter a class code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = verifyCode(cleanCode);

      if (!result.valid) {
        toast.error("Invalid class code. Please check with your teacher.");
        setIsSubmitting(false);
        return;
      }

      await enrollInClass(cleanCode);
      toast.success(`Joined ${result.classItem?.name || "Class"} successfully!`);
      router.replace("/student");
    } catch (err: any) {
      console.error("Join error:", err);
      toast.error("Failed to join class: " + err.message);
      setIsSubmitting(false);
    }
  };

  if (authLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#09130e]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 dark:border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 dark:bg-emerald-900/20 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/20 dark:bg-teal-900/20 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }}></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="mb-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <BrandLogo size="md" align="center" tagline="Classroom Verification" />
        </div>

        {/* Main Card */}
        <div className="glass rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-white/60 dark:border-[#1e3025] bg-white/60 dark:bg-[#121c16]/90 backdrop-blur-xl animate-in slide-in-from-bottom-6 fade-in duration-700">
          
          {/* User badge */}
          <div className="flex items-center justify-between p-3 bg-stone-50/80 dark:bg-[#18261e] rounded-2xl border border-stone-200/60 dark:border-[#243a2c] mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                {userData?.displayName?.charAt(0) || "S"}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Signed in as</p>
                <p className="text-sm font-bold text-stone-900 dark:text-white truncate">{userData?.displayName || "Student"}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{userData?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors shrink-0 ml-2 cursor-pointer"
              title="Switch account"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <KeyRound size={20} className="text-emerald-700 dark:text-emerald-400" /> Enter Class Code
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Ask your teacher for the class code, then enter it here to access your class materials and timetable.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Class Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. MCA2026"
                maxLength={15}
                disabled={isSubmitting}
                className="w-full px-4 py-3.5 bg-white dark:bg-[#16231b] border-2 border-stone-200 dark:border-[#243a2c] rounded-2xl font-mono text-center text-lg md:text-xl font-extrabold tracking-widest text-stone-900 dark:text-emerald-400 uppercase focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600 placeholder:font-normal placeholder:tracking-normal"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-md shadow-emerald-950/20 cursor-pointer disabled:cursor-not-allowed group"
            >
              <span>{isSubmitting ? "Verifying..." : "Join Class"}</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-100 dark:border-[#1e3025] flex items-start gap-2.5 text-xs text-stone-400 dark:text-stone-500">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-stone-400 dark:text-stone-500" />
            <p>
              Only students with a valid class code can view announcements, resources, and timetables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
