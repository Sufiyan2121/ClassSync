"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  LogOut, 
  ArrowRight,
  UserCheck
} from "lucide-react";

function LoginContent() {
  const { login, logout, userData, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  // Role selector state: default to ADMIN if ?role=admin, otherwise STUDENT
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "ADMIN">(
    roleParam?.toLowerCase() === "admin" ? "ADMIN" : "STUDENT"
  );

  // Sync role if query parameter changes
  useEffect(() => {
    if (roleParam?.toLowerCase() === "admin") {
      setSelectedRole("ADMIN");
    } else if (roleParam?.toLowerCase() === "student") {
      setSelectedRole("STUDENT");
    }
  }, [roleParam]);

  const handleLogin = async () => {
    await login(selectedRole);
  };

  const isStudent = selectedRole === "STUDENT";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-transparent relative overflow-hidden bg-[#dfe8df] dark:bg-[#09130e]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 dark:border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-screen overflow-hidden px-4 bg-[#dfe8df] dark:bg-[#09130e] transition-colors py-10">
      
      {/* Dynamic Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 dark:bg-emerald-900/20 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/20 dark:bg-teal-900/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-green-300/20 dark:bg-emerald-800/10 blur-[80px] animate-pulse" style={{ animationDelay: '4s' }}></div>

      <div className="w-full max-w-lg z-10">
        
        {/* Unified Brand Header */}
        <div className="mb-6 sm:mb-8 animate-in slide-in-from-bottom-6 fade-in duration-700">
          <BrandLogo size="lg" align="center" tagline="Choose your login portal to continue" />
        </div>

        {/* If user is already authenticated in browser, show active session notification bar */}
        {user && userData && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#121c16]/95 border border-emerald-400/60 dark:border-emerald-700/60 shadow-xl backdrop-blur-xl animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-emerald-900/30 shrink-0 overflow-hidden ring-2 ring-emerald-500/30">
                  {userData.photoURL ? (
                    <img src={userData.photoURL} alt={userData.displayName} className="w-full h-full object-cover" />
                  ) : (
                    userData.displayName?.charAt(0) || "U"
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 dark:text-white text-sm">
                      {userData.displayName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {userData.role}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-[200px] sm:max-w-[220px]">
                    {userData.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (userData.role === "ADMIN") {
                      router.push("/admin");
                    } else if (userData.enrolledClassCode) {
                      router.push("/student");
                    } else {
                      router.push("/join-class");
                    }
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <span>Go to App</span>
                  <ArrowRight size={13} />
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-[#1e3025] dark:hover:bg-[#253d2f] text-stone-700 dark:text-stone-300 text-xs font-bold transition border border-stone-200 dark:border-[#243a2c] cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login Card */}
        <div className="glass rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-white/60 dark:border-[#1e3025] bg-white/60 dark:bg-[#121c16]/90 backdrop-blur-xl animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-150 fill-mode-both">
          
          {/* Segmented Role Switcher: Student vs Teacher/Admin */}
          <div className="grid grid-cols-2 p-1.5 bg-stone-100/80 dark:bg-[#16231b] rounded-2xl border border-stone-200/80 dark:border-[#243a2c] mb-8">
            <button
              type="button"
              onClick={() => setSelectedRole("STUDENT")}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                isStudent
                  ? "bg-white dark:bg-[#121c16] text-stone-900 dark:text-emerald-400 shadow-sm border border-stone-200/60 dark:border-[#1e3025]"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              <GraduationCap size={18} className={isStudent ? "text-emerald-700 dark:text-emerald-400" : "text-stone-400"} />
              <span>Student Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("ADMIN")}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                !isStudent
                  ? "bg-white dark:bg-[#121c16] text-stone-900 dark:text-emerald-400 shadow-sm border border-stone-200/60 dark:border-[#1e3025]"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              <ShieldCheck size={18} className={!isStudent ? "text-emerald-700 dark:text-emerald-400" : "text-stone-400"} />
              <span>Teacher / Admin</span>
            </button>
          </div>

          {/* Portal Details Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
              <Sparkles size={12} />
              <span>{isStudent ? "Student Access" : "Faculty & Admin Access"}</span>
            </div>
            
            <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              {isStudent ? "Student Sign In" : "Teacher & Admin Sign In"}
            </h2>
            
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {isStudent 
                ? "Sign in to view your class announcements, timetable schedule, subjects, and birthday alerts."
                : "Sign in to post broadcasts, manage student approvals, timetables, and class codes."}
            </p>
          </div>

          {/* Portal Feature List */}
          <div className="p-4 rounded-2xl bg-stone-50/70 dark:bg-[#18261e] border border-stone-200/60 dark:border-[#243a2c] mb-6 space-y-2 text-xs text-stone-600 dark:text-stone-300">
            {isStudent ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Real-time announcements, assignments & exam dates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Interactive class timetable with PDF downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Subject notes, question banks & college event drives</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Broadcast instant announcements with due dates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Verify and approve student join requests per class</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Manage multiple class codes and lecture timetables</span>
                </div>
              </>
            )}
          </div>
          
          {/* Main Google Login Action Button */}
          <button
            type="button"
            onClick={handleLogin}
            className="group relative w-full flex items-center justify-center gap-3 bg-white hover:bg-stone-50 dark:bg-[#16231b] dark:hover:bg-[#1f3325] text-stone-800 dark:text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-sm border border-stone-200 dark:border-[#243a2c] hover:border-emerald-600 dark:hover:border-emerald-600 hover:shadow-md overflow-hidden cursor-pointer"
          >
            {/* Hover shine effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-stone-100/50 dark:via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
            
            <svg className="w-5 h-5 relative z-10 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="relative z-10">
              {isStudent ? "Sign in with Google as Student" : "Sign in with Google as Teacher / Admin"}
            </span>
          </button>

          {/* Verification Notice */}
          <div className="mt-5 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-[#121c16] border border-emerald-200/60 dark:border-[#1e3025] flex items-start gap-2.5 text-[11px] text-stone-600 dark:text-stone-400">
            <ShieldAlert size={16} className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isStudent 
                ? "After sign-in, enter your class code. Your request will be verified by the class teacher before access is granted."
                : "Teacher/Admin accounts require verification and approval by the platform developer."}
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-stone-400 dark:text-stone-500 font-medium max-w-[260px] mx-auto leading-relaxed">
              By securely logging in, you agree to ClassSync's Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#dfe8df] dark:bg-[#09130e]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 dark:border-emerald-400"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
