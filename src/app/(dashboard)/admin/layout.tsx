"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { isDeveloperEmail } from "@/lib/developer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Clock, ShieldAlert, LogOut, ArrowRight } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData, user, loading, logout } = useAuth();
  const router = useRouter();

  const isApprovedAdmin = Boolean(
    userData?.isDeveloper ||
    isDeveloperEmail(userData?.email) ||
    userData?.adminApprovalStatus === "APPROVED"
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?role=admin");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#dfe8df] dark:bg-[#09130e]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 dark:border-emerald-400"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Not an approved admin (e.g. Student trying to access Admin dashboard, or pending admin)
  if (!isApprovedAdmin) {
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
              <h2 className="text-xl font-bold text-stone-900 dark:text-white">Admin Approval Required</h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                Your account ({user.email}) does not have approved Teacher or Admin privileges.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-[#192318] border border-amber-200/80 dark:border-[#2a3f2c] text-left text-xs space-y-1.5 text-stone-600 dark:text-stone-300">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">Access Status</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300">
                  {userData?.adminApprovalStatus === "REJECTED" ? "Access Declined ❌" : "Under Review ⏳"}
                </span>
              </div>
              <p>Name: <strong>{userData?.displayName || user.displayName || "User"}</strong></p>
              <p className="truncate">Email: <strong>{user.email}</strong></p>
            </div>

            <div className="bg-emerald-50/50 dark:bg-[#121c16] rounded-xl p-3 border border-emerald-200/50 dark:border-[#1e3025] flex items-start gap-2.5 text-left">
              <ShieldAlert size={18} className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                If you are a student, please switch to the Student Portal. If you are faculty, contact the platform developer for authorization.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push("/student")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <span>Go to Student Portal</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-[#1e3025] dark:hover:bg-[#253d2f] text-stone-700 dark:text-stone-300 text-xs font-semibold transition border border-stone-200 dark:border-[#243a2c] cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
